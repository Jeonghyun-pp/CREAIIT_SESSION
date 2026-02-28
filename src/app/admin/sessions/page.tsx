import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "asc" },
    include: {
      _count: { select: { blocks: true, assets: true, submissions: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">세션 관리</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/sessions/import"
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            텍스트로 가져오기
          </Link>
          <Link
            href="/admin/sessions/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + 새 세션
          </Link>
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="text-slate-400">세션이 없습니다.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">제목</th>
                <th className="px-4 py-3 font-medium text-slate-600">날짜</th>
                <th className="px-4 py-3 font-medium text-slate-600">상태</th>
                <th className="px-4 py-3 font-medium text-slate-600">블록</th>
                <th className="px-4 py-3 font-medium text-slate-600">자료</th>
                <th className="px-4 py-3 font-medium text-slate-600">제출</th>
                <th className="px-4 py-3 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {s.title}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.date.toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.published
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.published ? "공개" : "비공개"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s._count.blocks}</td>
                  <td className="px-4 py-3 text-slate-500">{s._count.assets}</td>
                  <td className="px-4 py-3 text-slate-500">{s._count.submissions}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/sessions/${s.id}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      편집
                    </Link>
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
