import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { errorResponse, successResponse, AppError } from "@/lib/errors";
import { NextRequest } from "next/server";

// GET /api/admin/attendance?sessionId=xxx - 세션별 출석 현황
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (sessionId) {
      // 특정 세션의 출석 현황 (운영진 제외, MEMBER만)
      const attendances = await prisma.attendance.findMany({
        where: { sessionId, user: { role: "MEMBER" } },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      // 해당 세션에 출석하지 않은 ACTIVE MEMBER 목록도 함께 반환
      const checkedUserIds = attendances.map((a) => a.userId);
      const absentMembers = await prisma.user.findMany({
        where: {
          role: "MEMBER",
          status: "ACTIVE",
          id: { notIn: checkedUserIds.length > 0 ? checkedUserIds : ["_none_"] },
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });

      return successResponse({ attendances, absentMembers });
    }

    // 전체 세션의 출석 통계
    const sessions = await prisma.session.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        date: true,
        _count: {
          select: {
            attendances: { where: { user: { role: "MEMBER" } } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const totalMembers = await prisma.user.count({
      where: { role: "MEMBER", status: "ACTIVE" },
    });

    return successResponse({ sessions, totalMembers });
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT /api/admin/attendance - 관리자가 출석 상태 변경
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();

    const { sessionId, userId, status } = await req.json();

    if (!sessionId || !userId || !status) {
      throw new AppError("BAD_REQUEST", "sessionId, userId, status가 필요합니다", 400);
    }

    if (!["PRESENT", "LATE", "ABSENT"].includes(status)) {
      throw new AppError("BAD_REQUEST", "유효하지 않은 상태입니다", 400);
    }

    if (status === "ABSENT") {
      // ABSENT로 변경 = 출석 기록 삭제
      await prisma.attendance.deleteMany({
        where: { sessionId, userId },
      });
      return successResponse({ deleted: true });
    }

    const attendance = await prisma.attendance.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      update: { status },
      create: { sessionId, userId, status },
    });

    return successResponse(attendance);
  } catch (err) {
    return errorResponse(err);
  }
}
