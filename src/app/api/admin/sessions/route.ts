import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { errorResponse, successResponse } from "@/lib/errors";

// GET /api/admin/sessions — admin only, list ALL sessions (including unpublished)
export async function GET() {
  try {
    await requireAdmin();

    const sessions = await prisma.session.findMany({
      orderBy: { date: "asc" },
      include: {
        presenter: { select: { id: true, name: true } },
        _count: { select: { blocks: true, assets: true, submissions: true } },
      },
    });

    return successResponse(sessions);
  } catch (err) {
    return errorResponse(err);
  }
}
