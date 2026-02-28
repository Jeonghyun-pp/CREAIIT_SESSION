"use client";

import { useState, useEffect, useCallback } from "react";

interface SubmissionRow {
  id: string;
  submitterName: string | null;
  submitterEmail: string | null;
  githubUrl: string | null;
  fileAssetId: string | null;
  message: string | null;
  status: "SUBMITTED" | "REVIEWED";
  createdAt: string;
  sessionTitle: string;
  sessionId: string;
  fileAsset?: { id: string; fileName: string } | null;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSession, setFilterSession] = useState("all");
  const [sessions, setSessions] = useState<{ id: string; title: string }[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [sessRes, subRes] = await Promise.all([
        fetch("/api/admin/sessions"),
        fetch("/api/admin/submissions"),
      ]);
      const sessJson = await sessRes.json();
      const subJson = await subRes.json();

      if (sessJson.ok) setSessions(sessJson.data);
      if (subJson.ok) setSubmissions(subJson.data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleStatus(sub: SubmissionRow) {
    const newStatus = sub.status === "SUBMITTED" ? "REVIEWED" : "SUBMITTED";
    try {
      const res = await fetch(`/api/submissions/${sub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.ok) return;
      setSubmissions(
        submissions.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
      );
    } catch {
      // Ignore
    }
  }

  const filtered =
    filterSession === "all"
      ? submissions
      : submissions.filter((s) => s.sessionId === filterSession);

  if (loading) {
    return <div className="mx-auto max-w-5xl"><p className="text-slate-400">불러오는 중...</p></div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">제출물 조회</h1>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterSession}
          onChange={(e) => setFilterSession(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">전체 세션</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <span className="ml-3 text-sm text-slate-500">{filtered.length}건</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400">제출물이 없습니다.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">세션</th>
                <th className="px-4 py-3 font-medium text-slate-600">제출자</th>
                <th className="px-4 py-3 font-medium text-slate-600">제출 내용</th>
                <th className="px-4 py-3 font-medium text-slate-600">메시지</th>
                <th className="px-4 py-3 font-medium text-slate-600">제출일시</th>
                <th className="px-4 py-3 font-medium text-slate-600">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-slate-700">{sub.sessionTitle}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{sub.submitterName || "-"}</div>
                    {sub.submitterEmail && (
                      <div className="text-xs text-slate-400">{sub.submitterEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {sub.githubUrl ? (
                      <a
                        href={sub.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all text-xs"
                      >
                        {sub.githubUrl}
                      </a>
                    ) : sub.fileAsset ? (
                      <a
                        href={`/api/assets/${sub.fileAsset.id}/download`}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        {sub.fileAsset.fileName}
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                    {sub.message || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(sub.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(sub)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        sub.status === "REVIEWED"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {sub.status === "REVIEWED" ? "확인됨" : "미확인"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
