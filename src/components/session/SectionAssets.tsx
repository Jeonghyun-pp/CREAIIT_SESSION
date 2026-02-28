interface Asset {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  fileName: string;
  size: number;
  downloadCount: number;
}

interface SectionAssetsProps {
  assets: Asset[];
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
  ETC: "bg-gray-50 text-gray-700",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SectionAssets({ assets }: SectionAssetsProps) {
  if (assets.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-slate-800">자료 다운로드</h2>
      <div className="space-y-3">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  kindColors[asset.kind] || kindColors.ETC
                }`}
              >
                {kindLabels[asset.kind] || "기타"}
              </span>
              <div>
                <h3 className="text-sm font-medium text-slate-800">
                  {asset.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {asset.fileName} · {formatSize(asset.size)}
                </p>
              </div>
            </div>
            <a
              href={`/api/assets/${asset.id}/download`}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              다운로드
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
