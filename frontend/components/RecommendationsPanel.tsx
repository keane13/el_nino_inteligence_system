"use client";
import { useEffect } from "react";
import { Recommendation } from "@/lib/data";
import { Send } from "lucide-react";

interface Props { recommendations: Recommendation[] }

const PRIORITY_STYLE = {
  critical: {
    badge: "bg-red-500 text-white",
    border: "border-red-500/40",
    bg: "bg-red-500/5",
    bar: "#ef4444",
    label: "🚨 CRITICAL",
  },
  high: {
    badge: "bg-amber-500 text-[#0a0e1a]",
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    bar: "#f59e0b",
    label: "🟠 HIGH",
  },
  medium: {
    badge: "bg-blue-500 text-white",
    border: "border-blue-500/40",
    bg: "bg-blue-500/5",
    bar: "#3b82f6",
    label: "🔵 MEDIUM",
  },
  low: {
    badge: "bg-white/10 text-slate-300",
    border: "border-white/10",
    bg: "bg-white/5",
    bar: "#64748b",
    label: "⚪ LOW",
  },
};

const URGENCY_LABEL = (h: number) => {
  if (h <= 2) return { label: `Urgent (${h}h)`, color: "#ef4444" };
  if (h <= 12) return { label: `${h}h`, color: "#f59e0b" };
  return { label: `${h}h`, color: "#10b981" };
};

export default function RecommendationsPanel({ recommendations }: Props) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  recommendations.forEach(r => { counts[r.priority]++ });

  useEffect(() => {
    // Filter only El-Nino Critical recommendations
    const elNinoCritical = recommendations.filter(r => r.category === "El Niño Crisis" && r.priority === "critical");
    
    if (elNinoCritical.length > 0) {
      // Check if we already sent this exact batch to avoid spamming telegram on every page refresh
      const batchId = elNinoCritical.map(c => c.id).join('-');
      const sentFlag = localStorage.getItem(`telegram_sent_v2_${batchId}`);
      
      if (!sentFlag) {
        fetch('/api/telegram-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(elNinoCritical)
        }).then(res => {
          if (res.ok) {
            localStorage.setItem(`telegram_sent_v2_${batchId}`, 'true');
          }
        });
      }
    }
  }, [recommendations]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-thin">

      {/* Summary counts */}
      <div className="grid grid-cols-4 gap-2">
        {(["critical","high","medium","low"] as const).map(p => {
          const s = PRIORITY_STYLE[p];
          return (
            <div key={p} className={`rounded-lg p-2.5 border text-center shadow-sm backdrop-blur-sm ${s.border} ${s.bg}`}>
              <p className="text-[18px] font-bold font-mono" style={{ color: s.bar }}>{counts[p]}</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5 capitalize">{p}</p>
            </div>
          );
        })}
      </div>

      {/* Recommendation cards */}
      <div className="space-y-3">
        {recommendations.map(r => {
          const s = PRIORITY_STYLE[r.priority];
          const urg = URGENCY_LABEL(r.urgency_hours);
          return (
            <div key={r.id} className={`relative border rounded-xl p-4 shadow-sm backdrop-blur-sm ${s.border} ${s.bg} overflow-hidden`}>
              {/* Priority stripe */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ background: s.bar }} />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${s.badge}`}>
                    {s.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{r.id}</span>
                  {r.priority === "critical" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/40 text-indigo-400 bg-indigo-500/10 flex items-center gap-1 ml-2 shadow-[0_0_8px_rgba(99,102,241,0.2)]">
                      <Send size={10} /> Auto-Alert to Field Team
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-bold font-mono" style={{ color: urg.color }}>{urg.label}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">deadline</p>
                </div>
              </div>

              {/* Action */}
              <p className="text-[13px] font-bold text-white mb-2 leading-snug">{r.action}</p>

              {/* Rationale */}
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{r.rationale}</p>

              {/* Meta row */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-slate-300 shadow-sm">
                  📍 {r.district}
                </span>
                <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-slate-300 shadow-sm">
                  🏷 {r.category}
                </span>
                <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-slate-300 shadow-sm">
                  👥 {r.complaints_affected} reports
                </span>
              </div>

              {/* Impact */}
              <div className="bg-[#0f172a] rounded-lg px-3 py-2 border border-emerald-500/30 shadow-sm">
                <p className="text-[9px] text-emerald-500 uppercase tracking-wide mb-0.5">Impact Estimate</p>
                <p className="text-[11px] text-emerald-400 font-bold">{r.estimated_impact}</p>
              </div>
            </div>
          );
        })}
      </div>

      {!recommendations.length && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm font-medium">No active recommendations</p>
          <p className="text-xs mt-1">All reports are currently controlled</p>
        </div>
      )}
    </div>
  );
}
