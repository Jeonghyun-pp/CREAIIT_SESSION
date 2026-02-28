import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { errorResponse, successResponse, AppError } from "@/lib/errors";
import { z } from "zod";

const updateUserSchema = z.object({
  status: z.enum(["ACTIVE", "REJECTED"]),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();

    const { userId } = await params;
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION", parsed.error.issues[0].message);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("NOT_FOUND", "사용자를 찾을 수 없습니다", 404);
    }

    if (user.role === "ADMIN") {
      throw new AppError("FORBIDDEN", "관리자 계정의 상태는 변경할 수 없습니다", 403);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: parsed.data.status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return successResponse(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
