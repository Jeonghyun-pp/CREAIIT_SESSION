import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { getStorage } from "@/lib/storage";
import { errorResponse, successResponse, AppError } from "@/lib/errors";

type Params = { params: Promise<{ assetId: string }> };

// DELETE /api/assets/[assetId] — admin only
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { assetId } = await params;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new AppError("NOT_FOUND", "자료를 찾을 수 없습니다", 404);
    }

    // Delete file from storage
    const storage = getStorage();
    await storage.delete(asset.storageKey);

    // Delete DB record
    await prisma.asset.delete({ where: { id: assetId } });

    return successResponse({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}
