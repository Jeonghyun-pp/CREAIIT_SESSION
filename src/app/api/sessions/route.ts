import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { createSessionSchema } from "@/lib/validators/session";
import { errorResponse, successResponse, AppError } from "@/lib/errors";

// GET /api/sessions — public, list published sessions
export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      where: { published: true },
      orderBy: { date: "asc" },
      include: {
        _count: { select: { blocks: true, assets: true } },
      },
    });
    return successResponse(sessions);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/sessions — admin only
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION", parsed.error.issues[0].message);
    }

    const { blocks, ...sessionData } = parsed.data;
    const session = await prisma.session.create({
      data: {
        ...sessionData,
        date: new Date(sessionData.date),
        blocks: {
          create: blocks.map((b) => ({
            order: b.order,
            type: b.type,
            title: b.title,
            description: b.description || null,
            startTime: b.startTime || null,
            endTime: b.endTime || null,
          })),
        },
      },
      include: { blocks: { orderBy: { order: "asc" } } },
    });

    return successResponse(session, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
