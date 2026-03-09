"use client";

import { useEffect, useState } from "react";

interface Props {
  sessionId: string;
}

export function SectionAttendance({ sessionId }: Props) {
  const [eligible, setEligible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/attendance/status?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setEligible(data.data.eligible);
          setChecked(data.data.checked ?? false);
          setStatus(data.data.status ?? null);
          setCheckedAt(data.data.checkedAt ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  async function handleCheckIn() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.ok) {
        setChecked(true);
        setStatus("PRESENT");
        setCheckedAt(new Date().toISOString());
      } else {
        setError(data.error?.message || "출석 체크에 실패했습니다");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  // 비로그인 또는 ADMIN이면 섹션 자체를 숨김
  if (loading || !eligible) return null;

  const statusLabel = (s: string) => {
    switch (s) {
      case "PRESENT": return "출석";
      case "LATE": return "지각";
      case "ABSENT": return "결석";
      default: return s;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "PRESENT": return "bg-green-50 text-green-700 border-green-200";
      case "LATE": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">출석 체크</h2>

      {checked && status ? (
        <div className={`flex items-center gap-3 rounded-lg border p-4 ${statusColor(status)}`}>
          <span className="text-2xl">
            {status === "PRESENT" ? "✅" : status === "LATE" ? "⏰" : "❌"}
          </span>
          <div>
            <p className="font-medium">{statusLabel(status)} 처리되었습니다</p>
            {checkedAt && (
              <p className="mt-0.5 text-xs opacity-70">
                {new Date(checkedAt).toLocaleString("ko-KR", {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-slate-500">
            이 세션에 참석하셨다면 출석 체크 버튼을 눌러주세요.
          </p>
          <button
            onClick={handleCheckIn}
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "처리 중..." : "출석 체크하기"}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
