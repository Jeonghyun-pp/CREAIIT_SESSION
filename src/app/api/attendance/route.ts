import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { errorResponse, successResponse, AppError } from "@/lib/errors";
import { NextRequest } from "next/server";

// POST /api/attendance - 출석 체크
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== "MEMBER") {
      throw new AppError("FORBIDDEN", "회원만 출석 체크가 가능합니다", 403);
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new AppError("BAD_REQUEST", "세션 ID가 필요합니다", 400);
    }

    // 세션 존재 확인
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new AppError("NOT_FOUND", "세션을 찾을 수 없습니다", 404);
    }

    // 이미 출석한 경우
    const existing = await prisma.attendance.findUnique({
      where: { sessionId_userId: { sessionId, userId: user.id } },
    });
    if (existing) {
      throw new AppError("ALREADY_CHECKED", "이미 출석 체크하였습니다", 409);
    }

    const attendance = await prisma.attendance.create({
      data: {
        sessionId,
        userId: user.id,
        status: "PRESENT",
      },
    });

    return successResponse(attendance, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
