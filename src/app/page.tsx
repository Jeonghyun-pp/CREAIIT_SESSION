import { prisma } from "@/lib/db";
import { SessionCard } from "@/components/session/SessionCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessions = await prisma.session.findMany({
    where: { published: true },
    orderBy: { date: "asc" },
    include: { presenter: { select: { id: true, name: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold text-slate-800">
          CREAI+IT 세션
        </h1>
        <p className="text-slate-500">
          연세대학교 AI 창업학회의 세션 자료와 과제를 확인하세요.
        </p>
      </div>

      {sessions.length === 0 ? (
        <p className="text-center text-slate-400">아직 등록된 세션이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              id={s.id}
              title={s.title}
              date={s.date.toISOString()}
              summary={s.summary}
              goalCount={s.goals.length}
              presenterName={s.presenter?.name}
              location={s.location ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
