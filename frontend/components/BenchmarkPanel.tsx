"use client";
import { BenchmarkResult } from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, LineChart, Line,
} from "recharts";

interface Props { data: BenchmarkResult[] }

const fmt = (n: number) => n >= 1e6 ? `${n/1e6}M` : n >= 1e3 ? `${n/1e3}K` : `${n}`;

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: {name: string; value: number; color: string}[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#020617]/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2.5 text-[11px] shadow-lg">
      <p className="text-slate-400 mb-1.5 font-semibold">{label} rows</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono font-bold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value} ms
        </p>
      ))}
    </div>
  );
};

export default function BenchmarkPanel({ data }: Props) {
  const chartData = data.map(d => ({
    size: fmt(d.dataset_size),
    "pandas CPU": d.pandas_ms,
    "RAPIDS GPU": d.rapids_gpu_ms,
    speedup: d.speedup,
  }));

  const last = data[data.length - 1];
  const maxSpeedup = last?.speedup || 0;
  const timeSaved = last ? Math.round(last.pandas_ms - last.rapids_gpu_ms) : 0;

  return (
    <div className="h-full overflow-y-auto p-5 space-y-6 scrollbar-thin">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1 text-white">⚡ NVIDIA RAPIDS Acceleration</h2>
        <p className="text-[12px] text-slate-400 leading-relaxed max-w-xl">
          Pipeline scoring menggunakan <span className="text-violet-400 font-bold">cuDF / RAPIDS</span> pada NVIDIA A100 (Google Cloud).
          Operasi yang sama — <code className="bg-white/5 border border-white/10 px-1 rounded text-[11px] text-fuchsia-400">groupby → score → rank</code> — berjalan jauh lebih cepat di GPU untuk data skala besar.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Peak Speedup", val: `${maxSpeedup}×`, sub: "di 500K rows", color: "#00d4ff" },
          { label: "Waktu Tersimpan", val: `${timeSaved}ms`, sub: "per pipeline run", color: "#10b981" },
          { label: "GPU Target", val: "A100", sub: "NVIDIA on GCP", color: "#ff6b35" },
        ].map(k => (
          <div key={k.label} className="bg-white/5 border border-white/10 shadow-sm rounded-xl p-4 backdrop-blur-sm">
            <p className="text-[26px] font-bold font-mono" style={{ color: k.color }}>{k.val}</p>
            <p className="text-[11px] font-bold text-slate-300 mt-1">{k.label}</p>
            <p className="text-[10px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Side-by-side bar chart */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-sm rounded-xl p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Waktu Proses: pandas vs RAPIDS (ms)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="size" tick={{ fontSize: 11, fill: "#94a3b8" }} label={{ value: "Dataset Size", position: "insideBottom", offset: -2, fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} unit="ms" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            <Bar dataKey="pandas CPU" fill="#64748b" opacity={0.85} radius={[3,3,0,0]} />
            <Bar dataKey="RAPIDS GPU" fill="#10b981" opacity={0.9} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Speedup line chart */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-sm rounded-xl p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">GPU Speedup Factor (×)</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="size" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} unit="×" />
            <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px", color: "#8b5cf6" }} />
            <Line type="monotone" dataKey="speedup" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: "#8b5cf6", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-sm rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 gap-0 border-b border-white/10 bg-[#0f172a]/50">
          {["Dataset Size","pandas CPU","RAPIDS GPU","Speedup"].map((h, i) => (
            <div key={i} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 text-center">{h}</div>
          ))}
        </div>
        {data.map(d => (
          <div key={d.dataset_size} className="grid grid-cols-4 gap-0 border-b border-white/5 hover:bg-white/10 transition-colors">
            <div className="px-4 py-2.5 text-[11px] font-mono font-medium text-slate-300 text-center">{fmt(d.dataset_size)}</div>
            <div className="px-4 py-2.5 text-[11px] font-mono font-medium text-slate-400 text-center">{d.pandas_ms.toFixed(1)}ms</div>
            <div className="px-4 py-2.5 text-[11px] font-mono font-bold text-emerald-400 text-center">{d.rapids_gpu_ms.toFixed(1)}ms</div>
            <div className="px-4 py-2.5 text-[11px] font-mono text-violet-400 font-bold text-center">{d.speedup}×</div>
          </div>
        ))}
      </div>

      {/* Stack architecture */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-sm rounded-xl p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Stack Arsitektur</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              title: "Google Cloud Layer", color: "#60a5fa",
              items: ["☁️ Cloud Storage — raw ingest", "🔷 BigQuery — warehouse + SQL", "🚢 Cloud Run — FastAPI backend", "📊 Looker — BI dashboard", "🤖 Gemini Agent Platform"],
            },
            {
              title: "NVIDIA Acceleration", color: "#a3e635",
              items: ["⚡ cuDF — GPU DataFrame", "🚀 RAPIDS — analytics suite", "🔥 cudf.pandas — drop-in", "🎮 NVIDIA A100 on GCE", "📡 Spark RAPIDS — batch"],
            },
          ].map(s => (
            <div key={s.title}>
              <p className="text-[11px] font-bold mb-2" style={{ color: s.color }}>{s.title}</p>
              {s.items.map(item => (
                <p key={item} className="text-[11px] font-mono font-medium text-slate-400 py-0.5">{item}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 text-[10px] font-mono text-slate-500">
          Frontend: Next.js 15 + Tailwind + Recharts &nbsp;|&nbsp; Backend: FastAPI + Gemini &nbsp;|&nbsp; Data: BigQuery
        </div>
      </div>

    </div>
  );
}
