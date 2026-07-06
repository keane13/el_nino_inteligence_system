import RecommendationsPanel from "@/components/RecommendationsPanel";
import { getComplaints, generatePredictions, generateRecommendations, getDroughtData } from "@/lib/data";

export default function RecommendationsPage() {
  const complaints = getComplaints();
  const predictions = generatePredictions(complaints);
  const droughtData = getDroughtData();
  const recommendations = generateRecommendations(complaints, predictions, droughtData);

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Smart Alert Center</h1>
        <p className="text-slate-400 text-sm mt-1">Alert-First actionable tasks requiring immediate attention.</p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg flex-1 min-h-[600px] overflow-hidden">
        <RecommendationsPanel recommendations={recommendations} />
      </div>
    </div>
  );
}
