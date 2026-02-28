import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { errorResponse, successResponse, AppError } from "@/lib/errors";
import { getStorage } from "@/lib/storage";
import { MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from "@/lib/constants";

// POST /api/assets — admin only, upload asset file
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const sessionId = formData.get("sessionId") as string;
    const kind = formData.get("kind") as string;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const file = formData.get("file") as File | null;

    if (!sessionId || !kind || !title) {
      throw new AppError("VALIDATION", "sessionId, kind, title은 필수입니다");
    }
    if (!["SESSION_SLIDE", "LAB_SLIDE", "CODE", "ETC"].includes(kind)) {
      throw new AppError("VALIDATION", "올바른 자료 종류를 선택해주세요");
    }
    if (!file || file.size === 0) {
      throw new AppError("VALIDATION", "파일을 업로드해주세요");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError("VALIDATION", "파일 크기는 50MB 이하여야 합니다");
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
      throw new AppError("VALIDATION", `허용되지 않는 파일 형식입니다: ${ext}`);
    }

    // Check session exists
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new AppError("NOT_FOUND", "세션을 찾을 수 없습니다", 404);
    }

    // Store file
    const storage = getStorage();
    const storageKey = `assets/${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await storage.put(storageKey, buffer, file.type);

    const asset = await prisma.asset.create({
      data: {
        sessionId,
        kind: kind as "SESSION_SLIDE" | "LAB_SLIDE" | "CODE" | "ETC",
        title,
        description,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storageKey,
      },
    });

    return successResponse(asset, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
