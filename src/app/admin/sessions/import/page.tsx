"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseSessionText, type ParsedSession } from "@/lib/session-parser";

function BlockAccordion({ block }: { block: ParsedSession["blocks"][number] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-gray-100 transition-colors"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
          {block.order + 1}
        </span>
        <span className="flex-1 text-sm font-medium text-slate-800">{block.title}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && block.description && (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <p className="whitespace-pre-line text-xs text-slate-600 leading-relaxed">
            {block.description}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ImportSessionPage() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [dayNumber, setDayNumber] = useState(1);
  const [date, setDate] = useState("");
  const [parsed, setParsed] = useState<ParsedSession | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleParse() {
    setError("");
    try {
      const result = parseSessionText(raw);
      if (!result.title) {
        setError("헤더에서 제목을 찾지 못했습니다. '3/9 Session 1 — 제목' 형식인지 확인하세요.");
        return;
      }
      if (result.goals.length === 0) {
        setError("학습 목표를 찾지 못했습니다. '■ 오늘 배우는 것' 섹션이 있는지 확인하세요.");
        return;
      }
      // 파싱된 날짜를 기본값으로 세팅 (비어있을 때만)
      if (!date && result.date) setDate(result.date);
      setParsed(result);
    } catch {
      setError("텍스트 파싱 중 오류가 발생했습니다.");
    }
  }

  const displayTitle = parsed ? `${dayNumber}일차 세션: ${parsed.title}` : "";

  async function handleCreate() {
    if (!parsed || !date) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: displayTitle,
          date,
          summary: parsed.summary,
          goals: parsed.goals,
          prerequisites: parsed.prerequisites,
          published: true,
          blocks: parsed.blocks,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "생성에 실패했습니다");
      router.push("/admin/sessions");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">텍스트로 세션 가져오기</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step 1: Day number + Paste */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">1. 세션 정보 입력</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">몇 일차 세션인가요?</label>
            <select
              value={dayNumber}
              onChange={(e) => setDayNumber(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}일차
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">세션 날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-slate-400">텍스트에 날짜가 있으면 자동 입력됩니다</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">원문 텍스트</label>
          <textarea
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setParsed(null); }}
            rows={12}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={"━━━━━━━━━━━━━━━━━━━━━\n3/9 Session 1 — 제목\n━━━━━━━━━━━━━━━━━━━━━\n■ 세션 목표\n...\n■ 오늘 배우는 것\n1. ...\n■ 타임라인 상세 진행 내용\n① ...\n② ..."}
          />
        </div>

        <button
          type="button"
          onClick={handleParse}
          disabled={!raw.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          파싱하기
        </button>
      </div>

      {/* Step 2: Preview */}
      {parsed && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">2. 파싱 결과 미리보기</h2>

            {/* Title & Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium text-slate-500">제목</span>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{displayTitle}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500">날짜</span>
                <p className="mt-0.5 text-sm text-slate-800">{date}</p>
              </div>
            </div>

            {/* Summary */}
            <div>
              <span className="text-xs font-medium text-slate-500">요약</span>
              <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">{parsed.summary}</p>
            </div>

            {/* Goals */}
            <div>
              <span className="text-xs font-medium text-slate-500">학습 목표 ({parsed.goals.length}개)</span>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-slate-700">
                {parsed.goals.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Blocks - Accordion */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-2">
            <span className="text-xs font-medium text-slate-500">세션 일정 ({parsed.blocks.length}개)</span>
            {parsed.blocks.map((block) => (
              <BlockAccordion key={block.order} block={block} />
            ))}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading || !date}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "생성 중..." : "세션 생성"}
            </button>
            <button
              type="button"
              onClick={() => setParsed(null)}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-50"
            >
              다시 파싱
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/sessions")}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
