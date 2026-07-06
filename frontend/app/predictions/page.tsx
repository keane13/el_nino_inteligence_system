import PredictionsPanel from "@/components/PredictionsPanel";

export default function PredictionsPage() {
  return (
    <div className="h-full flex flex-col px-8 py-6 overflow-hidden">
      <div className="mb-5 shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          ML Forecasting
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          BigQuery ARIMA_PLUS threat forecasting · 7D · 1M · 3M · 6M horizons
        </p>
      </div>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg flex-1 min-h-0 overflow-hidden mx-4">
        <PredictionsPanel />
      </div>
    </div>
  );
}
