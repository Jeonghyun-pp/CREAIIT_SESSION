"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionOption {
  id: string;
  title: string;
}

interface AssetRow {
  id: string;
  kind: string;
  title: string;
  fileName: string;
  size: number;
  downloadCount: number;
  createdAt: string;
  session: { id: string; title: string };
}

const kindLabels: Record<string, string> = {
  SESSION_SLIDE: "세션 장표",
  LAB_SLIDE: "실습 장표",
  CODE: "코드",
  ETC: "기타",
};

const kindColors: Record<string, string> = {
  SESSION_SLIDE: "bg-blue-50 text-blue-700",
  LAB_SLIDE: "bg-green-50 text-green-700",
  CODE: "bg-purple-50 text-purple-700",
  ETC: "bg-gray-100 text-gray-700",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminAssetsPage() {
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Upload form state
  const [sessionId, setSessionId] = useState("");
  const [kind, setKind] = useState("SESSION_SLIDE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const loadData = useCallback(async () => {
    try {
      // Load all sessions (including unpublished) via admin endpoint
      const sessRes = await fetch("/api/admin/sessions");
      const sessJson = await sessRes.json();
      const allSessions = sessJson.ok ? sessJson.data : [];
      setSessions(allSessions);
      if (allSessions.length > 0 && !sessionId) {
        setSessionId(allSessions[0].id);
      }

      // Load all assets from each session's detail
      const allAssets: AssetRow[] = [];
      for (const sess of allSessions) {
        const detailRes = await fetch(`/api/sessions/${sess.id}`);
        const detailJson = await detailRes.json();
        if (detailJson.ok && detailJson.data.assets) {
          for (const a of detailJson.data.assets) {
            allAssets.push({ ...a, session: { id: sess.id, title: sess.title } });
          }
        }
      }
      setAssets(allAssets);
    } catch {
      setMessage({ type: "error", text: "데이터를 불러오는데 실패했습니다" });
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("sessionId", sessionId);
    formData.set("kind", kind);
    formData.set("title", title);
    formData.set("description", description);

    try {
      const res = await fetch("/api/assets", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "업로드 실패");
      setMessage({ type: "success", text: "자료가 업로드되었습니다" });
      setTitle("");
      setDescription("");
      form.reset();
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(assetId: string) {
    if (!confirm("이 자료를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "삭제 실패");
      setAssets(assets.filter((a) => a.id !== assetId));
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl"><p className="text-slate-400">불러오는 중...</p></div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">자료 관리</h1>

      {/* Upload Form */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-slate-800">자료 업로드</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">세션 *</label>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">종류 *</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="SESSION_SLIDE">세션 장표</option>
                <option value="LAB_SLIDE">실습 장표</option>
                <option value="CODE">코드</option>
                <option value="ETC">기타</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">제목 *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="자료 제목"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">설명</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="자료 설명 (선택)"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">파일 * (최대 50MB)</label>
            <input
              name="file"
              type="file"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700"
            />
          </div>

          {message && (
            <div className={`rounded-lg px-4 py-3 text-sm ${
              message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || sessions.length === 0}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        </form>
      </div>

      {/* Asset List */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-slate-800">업로드된 자료 ({assets.length})</h2>
        </div>
        {assets.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">아직 업로드된 자료가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className={`rounded-md px-2 py-1 text-xs font-medium ${kindColors[asset.kind] || kindColors.ETC}`}>
                    {kindLabels[asset.kind] || "기타"}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-slate-800">{asset.title}</h3>
                    <p className="text-xs text-slate-400">
                      {asset.session.title} · {asset.fileName} · {formatSize(asset.size)} · 다운로드 {asset.downloadCount}회
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/assets/${asset.id}/download`}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-gray-200"
                  >
                    다운로드
                  </a>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
