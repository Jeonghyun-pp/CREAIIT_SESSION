"use client";

import { useEffect, useState, useCallback } from "react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

type FilterStatus = "ALL" | "PENDING" | "ACTIVE" | "REJECTED";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const params = filter !== "ALL" ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/users${params}`);
      const data = await res.json();
      if (data.ok) setMembers(data.data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function updateStatus(userId: string, status: "ACTIVE" | "REJECTED") {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, status } : m))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "승인 대기";
      case "ACTIVE":
        return "활성";
      case "REJECTED":
        return "거절";
      default:
        return status;
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">회원 관리</h1>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {(["ALL", "PENDING", "ACTIVE", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-slate-600 hover:bg-gray-200"
            }`}
          >
            {s === "ALL" ? "전체" : statusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">로딩 중...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-slate-500">해당하는 회원이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">이름</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">이메일</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">역할</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">상태</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">가입일</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{member.name}</td>
                  <td className="px-4 py-3 text-slate-600">{member.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {member.role === "ADMIN" ? "관리자" : "학회원"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(member.status)}`}
                    >
                      {statusLabel(member.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(member.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    {member.role !== "ADMIN" && (
                      <div className="flex gap-2">
                        {member.status !== "ACTIVE" && (
                          <button
                            onClick={() => updateStatus(member.id, "ACTIVE")}
                            disabled={updating === member.id}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            승인
                          </button>
                        )}
                        {member.status !== "REJECTED" && (
                          <button
                            onClick={() => updateStatus(member.id, "REJECTED")}
                            disabled={updating === member.id}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            거절
                          </button>
                        )}
                      </div>
                    )}
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
