"use client";

import { useState, type ReactNode } from "react";

interface Block {
  id: string;
  order: number;
  type: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
}

interface SectionScheduleProps {
  blocks: Block[];
}

interface DisplayBlock {
  id: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  detail: string | null;
}

function formatTime(time: string | null): string {
  if (!time) return "";
  if (time.includes("T")) {
    return new Date(time).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return time;
}

function formatDescription(text: string): ReactNode {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line → spacer
    if (trimmed === "") {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Diagram block: lines starting with [ or containing ↓
    if (trimmed.startsWith("[") || trimmed === "↓") {
      const diagramLines: string[] = [];
      while (i < lines.length) {
        const dl = lines[i].trim();
        if (dl.startsWith("[") || dl === "↓" || dl === "") {
          if (dl === "" && i + 1 < lines.length && !lines[i + 1].trim().startsWith("[") && lines[i + 1].trim() !== "↓") break;
          if (dl !== "") diagramLines.push(dl);
          i++;
        } else break;
      }
      elements.push(
        <div key={`diagram-${i}`} className="my-2 flex flex-col items-center gap-0.5 rounded-lg bg-blue-50/60 px-4 py-3 font-mono text-xs text-blue-800">
          {diagramLines.map((dl, j) => (
            <span key={j} className={dl === "↓" ? "text-blue-400" : "font-medium"}>{dl}</span>
          ))}
        </div>
      );
      continue;
    }

    // Collect consecutive bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const bullets: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("• "))) {
        bullets.push(lines[i].trim().replace(/^[-•]\s*/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-1 space-y-1 pl-4">
          {bullets.map((b, j) => (
            <li key={j} className="flex gap-2 text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered item like "1)", "2)", "1."
    if (/^\d+[).]\s/.test(trimmed)) {
      const numberedItems: { num: string; text: string }[] = [];
      while (i < lines.length && /^\d+[).]\s/.test(lines[i].trim())) {
        const match = lines[i].trim().match(/^(\d+)[).]\s*(.*)/);
        if (match) numberedItems.push({ num: match[1], text: match[2] });
        i++;
        // Collect sub-bullets under this numbered item
        const subBullets: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("• "))) {
          subBullets.push(lines[i].trim().replace(/^[-•]\s*/, ""));
          i++;
        }
        if (subBullets.length > 0 && numberedItems.length > 0) {
          numberedItems[numberedItems.length - 1].text += "\n" + subBullets.map(s => `- ${s}`).join("\n");
        }
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-1 space-y-2 pl-1">
          {numberedItems.map((item, j) => {
            const parts = item.text.split("\n");
            const mainText = parts[0];
            const subs = parts.slice(1).filter(p => p.startsWith("- ")).map(p => p.replace(/^-\s*/, ""));
            return (
              <li key={j} className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                  {item.num}
                </span>
                <div className="flex-1">
                  <span className="font-medium text-slate-700">{mainText}</span>
                  {subs.length > 0 && (
                    <ul className="mt-1 space-y-0.5 pl-1">
                      {subs.map((s, k) => (
                        <li key={k} className="flex gap-2 text-slate-500">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      );
      continue;
    }

    // Section header: line ending with : or 다 or lines that are short & bold-looking
    if (
      (trimmed.endsWith(":") || trimmed.endsWith("다:")) &&
      trimmed.length < 60
    ) {
      elements.push(
        <p key={i} className="mt-2 mb-1 text-sm font-semibold text-slate-800">
          {trimmed}
        </p>
      );
      i++;
      continue;
    }

    // Regular text line
    elements.push(
      <p key={i} className="text-slate-600">
        {trimmed}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

function ScheduleItem({ block, isLast }: { block: DisplayBlock; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!block.detail;
  const hasTime = !!block.startTime;

  return (
    <div className={!isLast ? "border-b border-gray-100" : ""}>
      <button
        type="button"
        onClick={() => hasDetail && setOpen(!open)}
        className={`flex w-full items-stretch gap-4 text-left ${
          hasDetail ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
        }`}
      >
        {/* Time or index column */}
        <div className="flex w-24 shrink-0 flex-col justify-center py-3 text-right">
          {hasTime ? (
            <>
              <span className="text-sm font-semibold text-blue-600">
                {formatTime(block.startTime)}
              </span>
              {block.endTime && (
                <span className="text-xs text-slate-400">
                  ~ {formatTime(block.endTime)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-semibold text-blue-600" />
          )}
        </div>
        {/* Divider */}
        <div className="relative flex w-px items-center bg-gray-200">
          <div className="absolute left-[-3px] h-2 w-2 rounded-full bg-blue-400" />
        </div>
        {/* Content */}
        <div className="flex flex-1 items-center justify-between py-3 pl-3 pr-2">
          <h3 className="text-sm font-medium text-slate-800">{block.title}</h3>
          {hasDetail && (
            <svg
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>
      {/* Expanded detail */}
      {open && hasDetail && (
        <div className="ml-[calc(6rem+1px+0.75rem+1rem)] pb-3 pr-4">
          <div className="rounded-lg border border-gray-100 bg-slate-50/50 px-5 py-4 text-sm leading-relaxed">
            {formatDescription(block.detail!)}
          </div>
        </div>
      )}
    </div>
  );
}

export function SectionSchedule({ blocks }: SectionScheduleProps) {
  const timelineBlocks = blocks.filter((b) => b.type === "TIMELINE");
  const flowBlocks = blocks.filter((b) => b.type === "FLOW");

  if (timelineBlocks.length === 0 && flowBlocks.length === 0) return null;

  // TIMELINE 블록에 매칭되는 FLOW 설명을 병합
  const merged: DisplayBlock[] = timelineBlocks.map((tb) => {
    const match = flowBlocks.find(
      (fb) =>
        fb.title.includes(tb.title) ||
        tb.title.includes(fb.title) ||
        tb.description?.includes(fb.title) ||
        fb.description?.includes(tb.title)
    );
    // detail: FLOW 매칭이 있으면 FLOW description, 없으면 자체 description
    const detail = match?.description || tb.description || null;
    return {
      id: tb.id,
      title: tb.title,
      startTime: tb.startTime,
      endTime: tb.endTime,
      detail,
    };
  });

  // TIMELINE이 없으면 FLOW만으로 표시
  const items: DisplayBlock[] = merged.length > 0
    ? merged
    : flowBlocks.map((fb) => ({
        id: fb.id,
        title: fb.title,
        startTime: null,
        endTime: null,
        detail: fb.description || null,
      }));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-slate-800">세션 일정</h2>
      <div>
        {items.map((block, i) => (
          <ScheduleItem
            key={block.id}
            block={block}
            isLast={i === items.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
