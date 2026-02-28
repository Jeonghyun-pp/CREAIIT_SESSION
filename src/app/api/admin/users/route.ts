import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { errorResponse, successResponse } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const status = req.nextUrl.searchParams.get("status");
    const where = status ? { status: status as "PENDING" | "ACTIVE" | "REJECTED" } : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(users);
  } catch (err) {
    return errorResponse(err);
  }
}
