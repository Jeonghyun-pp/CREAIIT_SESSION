import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { errorResponse, successResponse, AppError } from "@/lib/errors";

type Params = { params: Promise<{ submissionId: string }> };

// PUT /api/submissions/[submissionId] — admin only, mark reviewed
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { submissionId } = await params;

    const body = await req.json();
    const status = body.status;
    if (!["SUBMITTED", "REVIEWED"].includes(status)) {
      throw new AppError("VALIDATION", "올바른 상태값이 아닙니다");
    }

    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: { status },
    });

    return successResponse(submission);
  } catch (err) {
    return errorResponse(err);
  }
}
