import AnalyticsPanel from "@/components/AnalyticsPanel";
import { getComplaints } from "@/lib/data";

export default function AnalyticsPage() {
  const complaints = getComplaints();

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Deep dive into city complaints metrics and historical data.</p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg flex-1 min-h-[600px] overflow-hidden">
        <AnalyticsPanel complaints={complaints} />
      </div>
    </div>
  );
}
