import Link from "next/link";

interface SessionCardProps {
  id: string;
  title: string;
  date: string;
  summary: string;
  goalCount: number;
  presenterName?: string;
}

export function SessionCard({ id, title, date, summary, goalCount, presenterName }: SessionCardProps) {
  const formattedDate = new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Link
      href={`/sessions/${id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {formattedDate}
        </span>
        <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
          목표 {goalCount}개
        </span>
        {presenterName && (
          <span className="inline-block rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            {presenterName}
          </span>
        )}
      </div>
      <h2 className="mb-2 text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
        {title}
      </h2>
      <p className="text-sm leading-relaxed text-slate-500 line-clamp-2">
        {summary}
      </p>
    </Link>
  );
}
