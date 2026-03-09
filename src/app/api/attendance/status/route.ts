import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/errors";
import { NextRequest } from "next/server";

// GET /api/attendance/status?sessionId=xxx - 현재 사용자의 출석 상태
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // 비로그인 또는 ADMIN이면 출석 대상 아님
    if (!session?.user || session.user.role !== "MEMBER") {
      return successResponse({ eligible: false });
    }

    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return successResponse({ eligible: true, checked: false });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { sessionId_userId: { sessionId, userId: session.user.id } },
    });

    return successResponse({
      eligible: true,
      checked: !!attendance,
      status: attendance?.status ?? null,
      checkedAt: attendance?.createdAt ?? null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
