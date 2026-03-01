import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { errorResponse, successResponse } from "@/lib/errors";

// GET /api/admin/presenters — admin only, list ADMIN+ACTIVE users as presenter candidates
export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    return successResponse(users);
  } catch (err) {
    return errorResponse(err);
  }
}
