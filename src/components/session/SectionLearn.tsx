interface SectionLearnProps {
  summary: string;
  goals: string[];
  prerequisites: string[];
}

export function SectionLearn({ summary, goals, prerequisites }: SectionLearnProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-slate-800">
        이 세션에서 배우는 것
      </h2>
      <p className="mb-5 leading-relaxed text-slate-600">{summary}</p>

      <div className="mb-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">학습 목표</h3>
        <ul className="space-y-2">
          {goals.map((goal, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">
                {i + 1}
              </span>
              {goal}
            </li>
          ))}
        </ul>
      </div>

      {prerequisites.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">사전 준비</h3>
          <div className="flex flex-wrap gap-2">
            {prerequisites.map((p, i) => (
              <span
                key={i}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
