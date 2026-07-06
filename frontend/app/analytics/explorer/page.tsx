import DataExplorer from "@/components/DataExplorer";

export default function ExplorerPage() {
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Data Explorer</h1>
        <p className="text-slate-400 text-sm mt-1">Drag and drop columns to query BigQuery and visualize results.</p>
      </div>

      <div className="flex-1 min-h-[600px] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden p-6">
        <DataExplorer />
      </div>
    </div>
  );
}
