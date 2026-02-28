interface TimelineBlock {
  id: string;
  order: number;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
}

interface SectionTimelineProps {
  blocks: TimelineBlock[];
}

function formatTime(time: string | null): string {
  if (!time) return "";
  // Handle both "HH:mm" format and ISO date strings
  if (time.includes("T")) {
    return new Date(time).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return time;
}

export function SectionTimeline({ blocks }: SectionTimelineProps) {
  if (blocks.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-slate-800">시간표</h2>
      <div className="space-y-0">
        {blocks.map((block, i) => (
          <div
            key={block.id}
            className={`flex items-stretch gap-4 ${
              i < blocks.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            {/* Time column */}
            <div className="flex w-28 shrink-0 flex-col justify-center py-3 text-right">
              <span className="text-sm font-semibold text-blue-600">
                {formatTime(block.startTime)}
              </span>
              {block.endTime && (
                <span className="text-xs text-slate-400">
                  ~ {formatTime(block.endTime)}
                </span>
              )}
            </div>
            {/* Divider */}
            <div className="relative flex w-px items-center bg-gray-200">
              <div className="absolute left-[-3px] h-2 w-2 rounded-full bg-blue-400" />
            </div>
            {/* Content */}
            <div className="flex-1 py-3 pl-3">
              <h3 className="text-sm font-medium text-slate-800">
                {block.title}
              </h3>
              {block.description && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {block.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
