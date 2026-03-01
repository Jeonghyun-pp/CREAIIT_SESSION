import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { SectionLearn } from "@/components/session/SectionLearn";
import { SectionSchedule } from "@/components/session/SectionSchedule";
import { SectionAssets } from "@/components/session/SectionAssets";
import { SectionSubmit } from "@/components/session/SectionSubmit";
import Link from "next/link";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionDetailPage({ params }: Props) {
  const { sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      presenter: { select: { id: true, name: true } },
      blocks: { orderBy: { order: "asc" } },
      assets: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!session) notFound();

  const formattedDate = session.date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-400">
        <Link href="/" className="hover:text-blue-600">홈</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">{session.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {formattedDate}
          </span>
          {session.presenter && (
            <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              {session.presenter.name}
            </span>
          )}
          {session.location && (
            <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              {session.location}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{session.title}</h1>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        <SectionLearn
          summary={session.summary}
          goals={session.goals}
          prerequisites={session.prerequisites}
        />

        <SectionSchedule blocks={session.blocks} />

        <SectionAssets assets={session.assets} />

        <SectionSubmit sessionId={session.id} />
      </div>
    </div>
  );
}
