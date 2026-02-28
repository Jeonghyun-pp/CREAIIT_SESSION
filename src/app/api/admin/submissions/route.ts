import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { errorResponse, successResponse } from "@/lib/errors";

// GET /api/admin/submissions — admin only, list all submissions
export async function GET() {
  try {
    await requireAdmin();

    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        session: { select: { id: true, title: true } },
        fileAsset: { select: { id: true, fileName: true } },
      },
    });

    const data = submissions.map((s) => ({
      id: s.id,
      sessionId: s.session.id,
      sessionTitle: s.session.title,
      submitterName: s.submitterName,
      submitterEmail: s.submitterEmail,
      githubUrl: s.githubUrl,
      fileAssetId: s.fileAssetId,
      fileAsset: s.fileAsset,
      message: s.message,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    }));

    return successResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
}
