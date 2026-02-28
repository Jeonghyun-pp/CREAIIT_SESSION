"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

interface SectionSubmitProps {
  sessionId: string;
}

type SubmitType = "github" | "file";

export function SectionSubmit({ sessionId }: SectionSubmitProps) {
  const { data: session, status: authStatus } = useSession();
  const [submitType, setSubmitType] = useState<SubmitType>("github");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 비로그인 시 로그인 유도
  if (authStatus === "loading") {
    return (
      <section className="rounded-xl border-2 border-gray-200 bg-gray-50/30 p-6">
        <p className="text-sm text-slate-500">로딩 중...</p>
      </section>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <section className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-6 text-center">
        <h2 className="mb-2 text-lg font-bold text-slate-800">과제 제출</h2>
        <p className="mb-4 text-sm text-slate-600">
          과제를 제출하려면 로그인이 필요합니다.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          로그인
        </Link>
      </section>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      if (submitType === "file") {
        // File upload: send as FormData
        formData.set("sessionId", sessionId);
        const res = await fetch("/api/submissions", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error?.message || "제출에 실패했습니다");
      } else {
        // GitHub link: send as JSON
        const body = {
          sessionId,
          githubUrl: formData.get("githubUrl") || "",
          message: formData.get("message") || "",
        };
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error?.message || "제출에 실패했습니다");
      }

      setMessage({ type: "success", text: "과제가 성공적으로 제출되었습니다!" });
      form.reset();
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-6">
      <h2 className="mb-1 text-lg font-bold text-slate-800">과제 제출</h2>
      <p className="mb-5 text-sm text-slate-500">
        GitHub 링크 또는 파일을 업로드하여 과제를 제출해주세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Email — 로그인 사용자 자동채움 + 수정 불가 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              이름
            </label>
            <input
              name="submitterName"
              type="text"
              value={session?.user?.name || ""}
              readOnly
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-slate-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              이메일
            </label>
            <input
              name="submitterEmail"
              type="email"
              value={session?.user?.email || ""}
              readOnly
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-slate-600"
            />
          </div>
        </div>

        {/* Submit type toggle */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            제출 방식
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSubmitType("github")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                submitType === "github"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-slate-600 hover:bg-gray-200"
              }`}
            >
              GitHub 링크
            </button>
            <button
              type="button"
              onClick={() => setSubmitType("file")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                submitType === "file"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-slate-600 hover:bg-gray-200"
              }`}
            >
              파일 업로드
            </button>
          </div>
        </div>

        {/* Conditional field */}
        {submitType === "github" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              GitHub URL
            </label>
            <input
              name="githubUrl"
              type="url"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://github.com/username/repo"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              파일 (최대 50MB)
            </label>
            <input
              name="file"
              type="file"
              required
              accept=".pdf,.pptx,.ppt,.zip,.py,.ipynb,.ts,.js,.md,.txt"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Message */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            메시지 <span className="text-slate-400">(선택)</span>
          </label>
          <textarea
            name="message"
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="과제에 대한 설명이나 메모를 남겨주세요"
          />
        </div>

        {/* Feedback */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "제출 중..." : "과제 제출"}
        </button>
      </form>
    </section>
  );
}
