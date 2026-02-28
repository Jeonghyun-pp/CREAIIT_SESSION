"use client";

import { useState } from "react";

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
          <div className="whitespace-pre-line rounded-lg bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
            {block.detail}
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
