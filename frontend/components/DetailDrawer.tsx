"use client";
import { Complaint } from "@/lib/data";

interface Props {
  complaint: Complaint | null;
  onClose: () => void;
}

const STATUS_STYLE: Record<string, string> = {
  "Open": "text-red-400",
  "Escalated": "text-amber-400",
  "In Progress": "text-cyan-400",
  "Resolved": "text-emerald-400",
};

function priorityColor(score: number) {
  if (score >= 60) return "#ef4444";
  if (score >= 45) return "#f59e0b";
  return "#3b82f6";
}

export default function DetailDrawer({ complaint, onClose }: Props) {
  if (!complaint) return null;
  const col = complaint.priority_score !== undefined ? priorityColor(complaint.priority_score) : "#94a3b8";
  
  // Try to use a description if it exists, or fallback
  const description = (complaint as any).description || (complaint as any).confidence ? `${(complaint as any).confidence} Confidence Fire Hotspot at ${(complaint as any).province}` : "No details available.";
  const location = complaint.district || (complaint as any).province || (complaint as any).station || (complaint as any).name || "Unknown Location";
  const kota = complaint.kota ? `, ${complaint.kota}` : "";


  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#020617]/90 backdrop-blur-md border-t border-white/10 px-5 py-4 z-50 animate-slide-up shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-mono text-slate-400">{complaint.id || (complaint as any).province || "Unknown ID"}</span>
          <h3 className="text-[14px] font-bold text-white">{complaint.category || (complaint as any).confidence ? "Wildfire Hotspot" : "Alert Detail"}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none px-1 transition-colors">×</button>
      </div>
      <div className="grid grid-cols-5 gap-3 mb-3">
        {[
          { label: "Priority Score", val: complaint.priority_score !== undefined ? Math.round(complaint.priority_score) : "N/A", color: col },
          { label: "Status", val: complaint.status || "N/A", color: undefined, cls: STATUS_STYLE[complaint.status || ""] },
          { label: "Traffic Impact", val: complaint.traffic_impact !== undefined ? `${complaint.traffic_impact}/5` : "N/A", color: "#f59e0b" },
          { label: "Severity", val: complaint.severity !== undefined ? `${complaint.severity}/5` : "N/A", color: "#ef4444" },
          { label: "Upvotes", val: complaint.upvotes !== undefined ? `${complaint.upvotes} 👍` : "N/A", color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-center shadow-sm backdrop-blur-sm">
            <p className={`text-[15px] font-bold font-mono ${s.cls || ""}`} style={s.color && !s.cls ? { color: s.color } : {}}>{s.val}</p>
            <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-slate-300 italic">
        "{description}" — <span className="text-slate-400 font-medium not-italic">{location}{kota}</span>
      </p>
    </div>
  );
}
