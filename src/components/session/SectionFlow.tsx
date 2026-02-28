interface FlowBlock {
  id: string;
  order: number;
  title: string;
  description: string | null;
}

interface SectionFlowProps {
  blocks: FlowBlock[];
}

export function SectionFlow({ blocks }: SectionFlowProps) {
  if (blocks.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-slate-800">전체 흐름</h2>
      <div className="relative ml-3">
        {/* Vertical line */}
        <div className="absolute left-0 top-2 bottom-2 w-px bg-blue-200" />

        <div className="space-y-4">
          {blocks.map((block, i) => (
            <div key={block.id} className="relative pl-6">
              {/* Dot */}
              <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-blue-500" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600">
                    Step {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {block.title}
                  </h3>
                </div>
                {block.description && (
                  <p className="mt-1 text-sm text-slate-500">
                    {block.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
