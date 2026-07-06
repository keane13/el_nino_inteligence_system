"use client";
import { Complaint } from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, Legend
} from "recharts";
import { useMemo } from "react";
import { Activity, AlertTriangle, CheckCircle2, Target } from "lucide-react";

interface Props {
  complaints: Complaint[];
}

const COLORS = ["#00d4ff","#7c3aed","#ff6b35","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#020617]/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-[12px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
      <p className="text-slate-400 mb-1.5 font-semibold text-[11px] uppercase tracking-wider">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-3 mt-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill || COLORS[0], boxShadow: `0 0 8px ${entry.color || entry.payload.fill || COLORS[0]}80` }} />
          <span className="text-slate-200 font-medium">{entry.name}:</span>
          <span className="text-white font-bold font-mono ml-auto">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPanel({ complaints }: Props) {
  const { catData, stData, stColors, distData, trendData, summary } = useMemo(() => {
    // Summary
    const open = complaints.filter(c => c.status === "Open").length;
    const escalated = complaints.filter(c => c.status === "Escalated").length;
    const resolved = complaints.filter(c => c.status === "Resolved").length;
    const avgPri = complaints.reduce((s, c) => s + c.priority_score, 0) / (complaints.length || 1);
    const resRate = Math.round((resolved / (complaints.length || 1)) * 100);

    // Category breakdown
    const catCounts: Record<string, number> = {};
    complaints.forEach(c => { catCounts[c.category] = (catCounts[c.category] || 0) + 1; });
    const catData = Object.entries(catCounts).sort((a,b) => b[1]-a[1]).slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 25 ? name.slice(0,25)+"…" : name, count }));

    // Status pie
    const stCounts: Record<string, number> = {};
    complaints.forEach(c => { stCounts[c.status] = (stCounts[c.status] || 0) + 1; });
    const stData = Object.entries(stCounts).map(([name, value]) => ({ name, value }));
    const stColors: Record<string,string> = { Open:"#ef4444", Escalated:"#f59e0b", "In Progress":"#00d4ff", Resolved:"#10b981" };

    // District bar
    const distCounts: Record<string, number> = {};
    complaints.forEach(c => { distCounts[c.district] = (distCounts[c.district] || 0) + 1; });
    const distData = Object.entries(distCounts).sort((a,b) => b[1]-a[1]).slice(0,10)
      .map(([name, count]) => ({ name, count }));

    // 14-day trend
    const trendData = Array.from({ length: 14 }, (_, i) => {
      const d = 13 - i;
      const count = complaints.filter(c => c.days_ago === d).length;
      return {
        day: d === 0 ? "Today" : `D-${d}`,
        Jumlah: count,
      };
    });

    return { 
      catData, stData, stColors, distData, trendData, 
      summary: { total: complaints.length, open, escalated, avgPri, resRate } 
    };
  }, [complaints]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 scrollbar-thin bg-gradient-to-b from-transparent to-[#020617]/50">

      {/* ── Metric Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Complaints", val: summary.total, icon: Activity, col: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Critical Escalations", val: summary.escalated, icon: AlertTriangle, col: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
          { label: "Average Priority", val: summary.avgPri.toFixed(1), icon: Target, col: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Resolution Rate", val: `${summary.resRate}%`, icon: CheckCircle2, col: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
        ].map((m, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${m.border} bg-white/5 backdrop-blur-md shadow-lg flex items-center gap-4 transition-all hover:bg-white/10 hover:scale-[1.02] cursor-default`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${m.bg} ${m.col}`}>
              <m.icon size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{m.label}</p>
              <p className={`text-2xl font-black font-mono tracking-tight ${m.col}`}>{m.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Area Chart Trend ───────────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[14px] font-bold text-white tracking-wide">Complaint Volume Trend (Last 14 Days)</h2>
            <p className="text-[11px] text-slate-400 mt-1">Daily reporting dynamics from citizens</p>
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Jumlah" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, fill: "#00d4ff", stroke: "#fff", strokeWidth: 2, style: { filter: "drop-shadow(0 0 8px #00d4ff)" } }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* ── Status Pie Chart ─────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md flex flex-col">
          <div className="mb-4">
            <h2 className="text-[14px] font-bold text-white tracking-wide">Status Distribution</h2>
            <p className="text-[11px] text-slate-400 mt-1">Percentage of resolved vs open reports</p>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 min-h-[280px]">
            <div className="w-full md:w-1/2 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stData} 
                    dataKey="value" 
                    cx="50%" cy="50%" 
                    innerRadius={70} 
                    outerRadius={100} 
                    paddingAngle={3}
                    stroke="none"
                  >
                    {stData.map((entry, i) => (
                      <Cell key={i} fill={stColors[entry.name] || COLORS[i]} style={{ filter: `drop-shadow(0 0 10px ${stColors[entry.name]}60)` }} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="w-full md:w-1/2 flex flex-col gap-3">
              {stData.map(s => {
                const perc = Math.round((s.value / summary.total) * 100);
                return (
                  <div key={s.name} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 transition-colors hover:bg-white/10">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: stColors[s.name], boxShadow: `0 0 10px ${stColors[s.name]}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-200 truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-400">{s.value} reports</p>
                    </div>
                    <div className="text-[16px] font-black font-mono text-white">{perc}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── District Bar Chart ─────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-[14px] font-bold text-white tracking-wide">Top 10 Worst Affected Districts</h2>
            <p className="text-[11px] text-slate-400 mt-1">Highest complaint volume by district</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={110} stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Bar dataKey="count" name="Jumlah" radius={[0,4,4,0]} barSize={16}>
                  {distData.map((_, i) => (
                    <Cell key={i} fill={COLORS[3]} style={{ filter: `drop-shadow(0 0 6px ${COLORS[3]}80)` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Category Breakdown (Full Width Bottom) ────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
        <div className="mb-6">
          <h2 className="text-[14px] font-bold text-white tracking-wide">Top 10 Complaint Categories</h2>
          <p className="text-[11px] text-slate-400 mt-1">Most common infrastructure issues mapping</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={catData} margin={{ top: 20, right: 20, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} angle={-35} textAnchor="end" dy={15} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="count" name="Jumlah" radius={[6,6,0,0]} barSize={24}>
                {catData.map((_, i) => (
                  <Cell key={i} fill={COLORS[1]} style={{ filter: `drop-shadow(0 0 10px ${COLORS[1]}80)` }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
