import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { updateSessionSchema } from "@/lib/validators/session";
import { errorResponse, successResponse, AppError } from "@/lib/errors";

type Params = { params: Promise<{ sessionId: string }> };

// GET /api/sessions/[sessionId] — public
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { sessionId } = await params;
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        presenter: { select: { id: true, name: true } },
        blocks: { orderBy: { order: "asc" } },
        assets: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!session) {
      throw new AppError("NOT_FOUND", "세션을 찾을 수 없습니다", 404);
    }
    return successResponse(session);
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT /api/sessions/[sessionId] — admin only
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { sessionId } = await params;

    const body = await req.json();
    const parsed = updateSessionSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION", parsed.error.issues[0].message);
    }

    const { blocks, date, presenterId, location, ...rest } = parsed.data;

    // Update session fields
    const updateData: Record<string, unknown> = { ...rest };
    if (date) updateData.date = new Date(date);
    if (location !== undefined) updateData.location = location || null;
    if (presenterId !== undefined) updateData.presenterId = presenterId || null;

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
    });

    // Replace blocks if provided
    if (blocks) {
      await prisma.sessionBlock.deleteMany({ where: { sessionId } });
      await prisma.sessionBlock.createMany({
        data: blocks.map((b) => ({
          sessionId,
          order: b.order,
          type: b.type,
          title: b.title,
          description: b.description || null,
          startTime: b.startTime || null,
          endTime: b.endTime || null,
        })),
      });
    }

    const updated = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        presenter: { select: { id: true, name: true } },
        blocks: { orderBy: { order: "asc" } },
      },
    });

    return successResponse(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/sessions/[sessionId] — admin only
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { sessionId } = await params;

    await prisma.session.delete({ where: { id: sessionId } });
    return successResponse({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}
