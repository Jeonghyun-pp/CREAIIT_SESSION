import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { createSubmissionSchema } from "@/lib/validators/submission";
import { errorResponse, successResponse, AppError } from "@/lib/errors";
import { getIpHash } from "@/lib/ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { getStorage } from "@/lib/storage";
import { MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from "@/lib/constants";
import { requireAuth } from "@/lib/auth-guard";
import path from "path";

// POST /api/submissions — 로그인 사용자만 제출 가능
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const ipHash = await getIpHash();
    const contentType = req.headers.get("content-type") || "";

    let sessionId: string;
    let githubUrl = "";
    let message = "";
    let fileAssetId: string | undefined;

    // 이름/이메일은 세션에서 자동 설정
    const submitterName = user.name || "";
    const submitterEmail = user.email || "";

    if (contentType.includes("multipart/form-data")) {
      // File upload submission
      const formData = await req.formData();
      sessionId = (formData.get("sessionId") as string) || "";
      message = (formData.get("message") as string) || "";

      const file = formData.get("file") as File | null;
      if (!file || file.size === 0) {
        throw new AppError("VALIDATION", "파일을 업로드해주세요");
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new AppError("VALIDATION", "파일 크기는 50MB 이하여야 합니다");
      }

      // Validate extension
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
        throw new AppError("VALIDATION", `허용되지 않는 파일 형식입니다: ${ext}`);
      }

      // Save file via storage adapter
      const storage = getStorage();
      const storageKey = `submissions/${randomUUID()}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await storage.put(storageKey, buffer, file.type);

      // Create asset record for the file
      const asset = await prisma.asset.create({
        data: {
          sessionId,
          kind: "ETC",
          title: `과제 제출: ${file.name}`,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          storageKey,
        },
      });
      fileAssetId = asset.id;
    } else {
      // JSON submission (GitHub link)
      const body = await req.json();
      const parsed = createSubmissionSchema.safeParse(body);
      if (!parsed.success) {
        throw new AppError("VALIDATION", parsed.error.issues[0].message);
      }
      sessionId = parsed.data.sessionId;
      githubUrl = parsed.data.githubUrl || "";
      message = parsed.data.message || "";
    }

    // Validate that at least githubUrl or file is provided
    if (!githubUrl && !fileAssetId) {
      throw new AppError("VALIDATION", "GitHub URL 또는 파일 중 하나를 제출해주세요");
    }

    // Check session exists
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new AppError("NOT_FOUND", "세션을 찾을 수 없습니다", 404);
    }

    // Rate limit check
    const rlKey = `${ipHash}:${sessionId}`;
    const rl = checkRateLimit(rlKey);
    if (!rl.allowed) {
      throw new AppError(
        "RATE_LIMIT",
        `너무 많은 제출 시도입니다. ${Math.ceil(rl.retryAfterMs / 60000)}분 후 다시 시도해주세요`,
        429
      );
    }

    const submission = await prisma.submission.create({
      data: {
        sessionId,
        userId: user.id,
        submitterName: submitterName || null,
        submitterEmail: submitterEmail || null,
        githubUrl: githubUrl || null,
        fileAssetId: fileAssetId || null,
        message: message || null,
        ipHash,
      },
    });

    return successResponse(submission, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
