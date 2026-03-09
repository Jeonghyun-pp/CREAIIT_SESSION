"use client";

import { useEffect, useState, useCallback } from "react";

interface SessionStat {
  id: string;
  title: string;
  date: string;
  _count: { attendances: number };
}

interface AttendanceRecord {
  id: string;
  sessionId: string;
  userId: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
}

interface AbsentMember {
  id: string;
  name: string;
  email: string;
}

export default function AdminAttendancePage() {
  const [sessions, setSessions] = useState<SessionStat[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [absentMembers, setAbsentMembers] = useState<AbsentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/attendance")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setSessions(data.data.sessions);
          setTotalMembers(data.data.totalMembers);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchDetail = useCallback(async (sessionId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.ok) {
        setAttendances(data.data.attendances);
        setAbsentMembers(data.data.absentMembers);
      }
    } finally {
      setDetailLoading(false);
    }
  }, []);

  async function updateStatus(sessionId: string, userId: string, status: string) {
    setUpdating(`${userId}-${status}`);
    try {
      const res = await fetch("/api/admin/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userId, status }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchDetail(sessionId);
      }
    } finally {
      setUpdating(null);
    }
  }

  function handleSelectSession(sessionId: string) {
    setSelectedSession(sessionId);
    fetchDetail(sessionId);
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800";
      case "LATE":
        return "bg-yellow-100 text-yellow-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "출석";
      case "LATE":
        return "지각";
      case "ABSENT":
        return "결석";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-slate-800">출석 관리</h1>
        <p className="text-sm text-slate-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">출석 관리</h1>

      {!selectedSession ? (
        <>
          <p className="mb-4 text-sm text-slate-500">
            활성 회원 수: <span className="font-semibold text-slate-700">{totalMembers}명</span>
          </p>

          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500">게시된 세션이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">세션</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">날짜</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">출석</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">출석률</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map((s) => {
                    const rate = totalMembers > 0
                      ? Math.round((s._count.attendances / totalMembers) * 100)
                      : 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{s.title}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(s.date).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {s._count.attendances} / {totalMembers}명
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{rate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleSelectSession(s.id)}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            상세보기
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => setSelectedSession(null)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; 목록으로 돌아가기
          </button>

          {detailLoading ? (
            <p className="text-sm text-slate-500">로딩 중...</p>
          ) : (
            <div className="space-y-6">
              {/* 출석한 회원 */}
              <div>
                <h2 className="mb-3 text-lg font-semibold text-slate-700">
                  출석 ({attendances.length}명)
                </h2>
                {attendances.length === 0 ? (
                  <p className="text-sm text-slate-500">출석한 회원이 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">이름</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">이메일</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">상태</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">체크 시간</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {attendances.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {a.user.name}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{a.user.email}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(a.status)}`}
                              >
                                {statusLabel(a.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(a.createdAt).toLocaleString("ko-KR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {a.status !== "PRESENT" && (
                                  <button
                                    onClick={() => updateStatus(selectedSession, a.userId, "PRESENT")}
                                    disabled={updating !== null}
                                    className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                                  >
                                    출석
                                  </button>
                                )}
                                {a.status !== "LATE" && (
                                  <button
                                    onClick={() => updateStatus(selectedSession, a.userId, "LATE")}
                                    disabled={updating !== null}
                                    className="rounded bg-yellow-500 px-2 py-1 text-xs text-white hover:bg-yellow-600 disabled:opacity-50"
                                  >
                                    지각
                                  </button>
                                )}
                                <button
                                  onClick={() => updateStatus(selectedSession, a.userId, "ABSENT")}
                                  disabled={updating !== null}
                                  className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 미출석 회원 */}
              <div>
                <h2 className="mb-3 text-lg font-semibold text-slate-700">
                  미출석 ({absentMembers.length}명)
                </h2>
                {absentMembers.length === 0 ? (
                  <p className="text-sm text-slate-500">모든 회원이 출석했습니다.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">이름</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">이메일</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {absentMembers.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                            <td className="px-4 py-3 text-slate-600">{m.email}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => updateStatus(selectedSession, m.id, "PRESENT")}
                                  disabled={updating !== null}
                                  className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  출석
                                </button>
                                <button
                                  onClick={() => updateStatus(selectedSession, m.id, "LATE")}
                                  disabled={updating !== null}
                                  className="rounded bg-yellow-500 px-2 py-1 text-xs text-white hover:bg-yellow-600 disabled:opacity-50"
                                >
                                  지각
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
