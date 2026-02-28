import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { errorResponse, AppError } from "@/lib/errors";

type Params = { params: Promise<{ assetId: string }> };

// GET /api/assets/[assetId]/download — public
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { assetId } = await params;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new AppError("NOT_FOUND", "자료를 찾을 수 없습니다", 404);
    }

    const storage = getStorage();
    const exists = await storage.exists(asset.storageKey);
    if (!exists) {
      throw new AppError("NOT_FOUND", "파일이 존재하지 않습니다", 404);
    }

    const { data } = await storage.get(asset.storageKey);

    // Increment download count (fire-and-forget)
    prisma.asset.update({
      where: { id: assetId },
      data: { downloadCount: { increment: 1 } },
    }).catch(() => {});

    // Encode filename for Content-Disposition (RFC 5987)
    const encodedName = encodeURIComponent(asset.fileName).replace(/%20/g, "+");

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Disposition": `attachment; filename="${asset.fileName}"; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(data.length),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
