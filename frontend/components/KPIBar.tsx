"use client";
import { Summary, ElNinoSummary } from "@/lib/data";

interface Props { 
  summary: Summary | null;
  elnino: ElNinoSummary | null;
}

const kpis = [
  { key: "total_complaints", label: "Total Complaints", color: "#00d4ff", source: "summary" },
  { key: "open_complaints", label: "Open", color: "#ef4444", source: "summary" },
  { key: "high_priority_count", label: "High Priority", color: "#ff6b35", source: "summary" },
  { key: "oni_index", label: "ONI Index", color: "#f59e0b", source: "elnino" },
  { key: "total_fire_hotspots", label: "Total Hotspots", color: "#ef4444", source: "elnino" },
  { key: "worst_aqi_value", label: "Max AQI", color: "#a78bfa", source: "elnino" },
] as const;

export default function KPIBar({ summary, elnino }: Props) {
  return (
    <div className="flex items-center gap-6">
      {kpis.map(k => {
        const value = k.source === "summary" 
          ? (summary ? summary[k.key as keyof Summary] : "—")
          : (elnino ? elnino[k.key as keyof ElNinoSummary] : "—");
        return (
          <div key={k.key} className="flex flex-col items-center gap-0.5">
            <span className="text-[17px] font-bold font-mono leading-none" style={{ color: k.color }}>
              {value}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wide whitespace-nowrap">{k.label}</span>
          </div>
        );
      })}
    </div>
  );
}
