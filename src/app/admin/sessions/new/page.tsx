"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BlockInput {
  type: "TIMELINE";
  order: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export default function NewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [goals, setGoals] = useState<string[]>([""]);
  const [prerequisites, setPrerequisites] = useState<string[]>([""]);
  const [published, setPublished] = useState(false);
  const [blocks, setBlocks] = useState<BlockInput[]>([]);

  function addGoal() {
    setGoals([...goals, ""]);
  }
  function updateGoal(i: number, val: string) {
    const next = [...goals];
    next[i] = val;
    setGoals(next);
  }
  function removeGoal(i: number) {
    if (goals.length <= 1) return;
    setGoals(goals.filter((_, idx) => idx !== i));
  }

  function addPrerequisite() {
    setPrerequisites([...prerequisites, ""]);
  }
  function updatePrerequisite(i: number, val: string) {
    const next = [...prerequisites];
    next[i] = val;
    setPrerequisites(next);
  }
  function removePrerequisite(i: number) {
    setPrerequisites(prerequisites.filter((_, idx) => idx !== i));
  }

  function addBlock() {
    setBlocks([
      ...blocks,
      { type: "TIMELINE", order: blocks.length, title: "", description: "", startTime: "", endTime: "" },
    ]);
  }
  function updateBlock(i: number, field: keyof BlockInput, val: string) {
    const next = [...blocks];
    next[i] = { ...next[i], [field]: val };
    setBlocks(next);
  }
  function removeBlock(i: number) {
    setBlocks(blocks.filter((_, idx) => idx !== i).map((b, idx) => ({ ...b, order: idx })));
  }

  async function generateWithAI() {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/admin/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, sessionTitle: title, sessionSummary: summary }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "생성에 실패했습니다");

      const generated: BlockInput[] = data.data.map(
        (b: { title: string; description: string; startTime: string; endTime: string }, i: number) => ({
          type: "TIMELINE" as const,
          order: i,
          title: b.title,
          description: b.description,
          startTime: b.startTime,
          endTime: b.endTime,
        })
      );

      setBlocks(generated);
      setAiPrompt("");
      setShowAiPanel(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date,
          summary,
          goals: goals.filter((g) => g.trim()),
          prerequisites: prerequisites.filter((p) => p.trim()),
          published,
          blocks: blocks.map((b, i) => ({ ...b, order: i })),
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
      <h1 className="mb-6 text-2xl font-bold text-slate-800">새 세션 생성</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">기본 정보</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">제목 *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="1일차 세션"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">날짜 *</label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">요약 *</label>
            <textarea
              required
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="이 세션에서 배우는 내용을 요약해주세요"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded border-gray-300"
            />
            공개 (학생에게 보이기)
          </label>
        </div>

        {/* Goals */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">학습 목표</h2>
            <button type="button" onClick={addGoal} className="text-sm text-blue-600 hover:text-blue-800">
              + 추가
            </button>
          </div>
          {goals.map((g, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={g}
                onChange={(e) => updateGoal(i, e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={`목표 ${i + 1}`}
              />
              {goals.length > 1 && (
                <button type="button" onClick={() => removeGoal(i)} className="text-sm text-red-500 hover:text-red-700">
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Prerequisites */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">사전 준비물</h2>
            <button type="button" onClick={addPrerequisite} className="text-sm text-blue-600 hover:text-blue-800">
              + 추가
            </button>
          </div>
          {prerequisites.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={p}
                onChange={(e) => updatePrerequisite(i, e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={`준비물 ${i + 1}`}
              />
              <button type="button" onClick={() => removePrerequisite(i)} className="text-sm text-red-500 hover:text-red-700">
                삭제
              </button>
            </div>
          ))}
        </div>

        {/* Blocks */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">세션 일정</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
              >
                AI 생성
              </button>
              <button type="button" onClick={addBlock} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-gray-200">
                + 일정 추가
              </button>
            </div>
          </div>

          {/* AI Generation Panel */}
          {showAiPanel && (
            <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-3">
              <p className="text-sm font-medium text-purple-800">AI로 일정 생성</p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="예: 14시~17시, AI 기초 이론 강의 50분 + 프롬프트 실습 1시간 + 과제 안내, 쉬는 시간 포함"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {aiGenerating ? "생성 중..." : "생성"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAiPanel(false); setAiPrompt(""); }}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-gray-100"
                >
                  닫기
                </button>
                {blocks.length > 0 && (
                  <p className="text-xs text-red-500">* 생성 시 기존 일정이 대체됩니다</p>
                )}
              </div>
            </div>
          )}

          {blocks.length === 0 && !showAiPanel && (
            <p className="text-sm text-slate-400">일정이 없습니다. 직접 추가하거나 AI로 생성하세요.</p>
          )}
          {blocks.map((block, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">#{i + 1}</span>
                <button type="button" onClick={() => removeBlock(i)} className="text-xs text-red-500 hover:text-red-700">
                  삭제
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">시작 시간</label>
                  <input
                    type="time"
                    value={block.startTime}
                    onChange={(e) => updateBlock(i, "startTime", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">종료 시간</label>
                  <input
                    type="time"
                    value={block.endTime}
                    onChange={(e) => updateBlock(i, "endTime", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <input
                value={block.title}
                onChange={(e) => updateBlock(i, "title", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="제목 (예: 이론 강의)"
              />
              <textarea
                value={block.description}
                onChange={(e) => updateBlock(i, "description", e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="상세 내용 (선택)"
              />
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "생성 중..." : "세션 생성"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/sessions")}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
