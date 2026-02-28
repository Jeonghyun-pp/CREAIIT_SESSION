import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">관리자 대시보드</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard
          href="/admin/sessions"
          title="세션 관리"
          description="세션을 생성, 수정, 삭제합니다"
        />
        <DashboardCard
          href="/admin/assets"
          title="자료 관리"
          description="세션 장표와 실습 자료를 업로드합니다"
        />
        <DashboardCard
          href="/admin/submissions"
          title="제출물 조회"
          description="학생들의 과제 제출물을 확인합니다"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
    >
      <h2 className="mb-2 text-lg font-semibold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500">{description}</p>
    </Link>
  );
}
