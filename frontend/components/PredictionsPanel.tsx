"use client";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DataPoint {
  date: string; value: number; lower?: number; upper?: number; type: "history" | "forecast";
}
interface ForecastData {
  threat: string; label: string; unit: string; color: string; icon: string;
  province: string; horizon_days: number; history_days: number;
  model: string; model_note: string; bqml_table: string; bqml_ready: boolean;
  data_source: string; confidence: number; mape: number; aic: number; r_squared: number;
  trend: string; pct_change: number; current_value: number; projected_value: number;
  history: DataPoint[]; forecast: DataPoint[];
  generated_at: string;
}
interface HorizonSummary {
  label: string; projected_value: number; pct_change: number;
  trend: string; confidence: number; mape: number;
}
interface ThreatSummary {
  threat: string; label: string; icon: string; unit: string; color: string;
  bqml_ready: boolean; horizons: Record<string, HorizonSummary>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const THREATS = [
  { slug: "water_supply",    label: "Water Supply",     unit: "liter/detik", color: "#0ea5e9", icon: "💧", desc: "Pasokan & Kapasitas Air" },
  { slug: "drought",         label: "Drought",          unit: "kejadian",    color: "#f59e0b", icon: "🏜️", desc: "Kekeringan & Curah Hujan" },
  { slug: "wildfire",        label: "Kebakaran",        unit: "kejadian",    color: "#ef4444", icon: "🔥", desc: "Karhutla & Kebakaran" },
  { slug: "air_quality",     label: "Air Quality",      unit: "µg/m³",       color: "#8b5cf6", icon: "🌫️", desc: "PM2.5 Kualitas Udara" },
  { slug: "food_security",   label: "Food Security",    unit: "rasio (%)",   color: "#10b981", icon: "🌾", desc: "Ketahanan Pangan" },
  { slug: "emerging_disease",label: "Penyakit",         unit: "kasus",       color: "#ec4899", icon: "🦠", desc: "ISPA & Diare" },
];

const HORIZONS = [
  { key: "7d", label: "7 Days",   short: "1W" },
  { key: "1m", label: "1 Month",  short: "1M" },
  { key: "3m", label: "3 Months", short: "3M" },
  { key: "6m", label: "6 Months", short: "6M" },
];

const PROVINCES = [
  "All Provinces",
  "Aceh","Bali","Bangka Belitung","Banten","Bengkulu","DI Yogyakarta",
  "DKI Jakarta","Gorontalo","Jambi","Jawa Barat","Jawa Tengah","Jawa Timur",
  "Kalimantan Barat","Kalimantan Selatan","Kalimantan Tengah","Kalimantan Timur","Kalimantan Utara",
  "Kepulauan Riau","Lampung","Maluku","Maluku Utara","Nusa Tenggara Barat","Nusa Tenggara Timur",
  "Papua","Papua Barat","Papua Barat Daya","Papua Pegunungan","Papua Selatan","Papua Tengah",
  "Riau","Sulawesi Barat","Sulawesi Selatan","Sulawesi Tengah","Sulawesi Tenggara","Sulawesi Utara",
  "Sumatera Barat","Sumatera Selatan","Sumatera Utara",
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function TrendBadge({ trend, pct }: { trend: string; pct: number }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    rising:  { label: "↑ Rising",  cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    stable:  { label: "→ Stable",  cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    falling: { label: "↓ Falling", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  };
  const { label, cls } = cfg[trend] ?? { label: trend, cls: "bg-white/10 text-slate-400 border-white/10" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}>
      {label} {pct > 0 ? "+" : ""}{pct}%
    </span>
  );
}

function BQMLBadge({ ready }: { ready: boolean }) {
  return (
    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 shrink-0 ${
      ready ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ready ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
      {ready ? "BQML LIVE" : "PENDING"}
    </span>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
      <p className="text-[10px] text-slate-400 mb-1">{label}</p>
      <p className="text-[17px] font-bold font-mono leading-tight" style={{ color: color || "#fff" }}>{value}</p>
      {sub && <p className="text-[9px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-[#020617]/95 border border-white/10 rounded-lg px-3 py-2 text-[10px] shadow-xl min-w-[150px]">
      <p className="text-slate-400 mb-1.5 font-mono">{label}</p>
      {payload.map((p: any, i: number) => p.value !== null && p.value !== undefined && (
        <p key={i} className="flex justify-between gap-3 font-mono" style={{ color: p.color }}>
          <span className="text-slate-400">{p.name}:</span>
          <span>{Number(p.value).toFixed(1)}</span>
        </p>
      ))}
      {d?.type === "forecast" && d?.lower !== undefined && (
        <p className="text-slate-500 mt-1 font-mono text-[9px]">
          CI: [{Number(d.lower).toFixed(1)}, {Number(d.upper).toFixed(1)}]
        </p>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function PredictionsPanel() {
  const [selectedThreat, setSelectedThreat] = useState("water_supply");
  const [selectedHorizon, setSelectedHorizon] = useState("7d");
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [summary, setSummary] = useState<ThreatSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setLoading(true);
    const province = selectedProvince !== "All Provinces" ? `&province=${encodeURIComponent(selectedProvince)}` : "";
    fetch(`/api/forecast/${selectedThreat}?horizon=${selectedHorizon}${province}`)
      .then(r => r.json())
      .then(d => setForecastData(d))
      .catch(() => setForecastData(null))
      .finally(() => setLoading(false));
  }, [selectedThreat, selectedHorizon, selectedProvince]);

  useEffect(() => {
    setSummaryLoading(true);
    const province = selectedProvince !== "All Provinces" ? `?province=${encodeURIComponent(selectedProvince)}` : "";
    fetch(`/api/forecast/${selectedThreat}/summary${province}`)
      .then(r => r.json())
      .then(d => setSummary(d))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [selectedThreat, selectedProvince]);

  const threat = THREATS.find(t => t.slug === selectedThreat) || THREATS[0];

  // Merge history + forecast — map forecast to separate key for chart
  const chartData = forecastData ? [
    ...forecastData.history.map(d => ({ ...d, forecast_val: null as number | null })),
    ...forecastData.forecast.map(d => ({ ...d, value: null as number | null, forecast_val: d.value })),
  ] : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Header / Filters ─────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl shrink-0">

        {/* Row 1: Title + Model status */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              ML Forecasting Engine · BigQuery ARIMA_PLUS
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              6 Threat Categories · 4 Horizons (7D · 1M · 3M · 6M) · Per Province
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BQMLBadge ready={forecastData?.bqml_ready ?? false} />
          </div>
        </div>

        {/* Row 2: Threat selector */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {THREATS.map(t => (
            <button
              key={t.slug}
              onClick={() => setSelectedThreat(t.slug)}
              title={t.desc}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all`}
              style={selectedThreat === t.slug ? {
                background: `${t.color}1a`,
                borderColor: `${t.color}60`,
                color: t.color,
                boxShadow: `0 0 10px ${t.color}18`,
              } : {
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.1)",
                color: "#94a3b8",
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Row 3: Horizon + Province filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Horizon */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 whitespace-nowrap">Horizon:</span>
            {HORIZONS.map(h => (
              <button
                key={h.key}
                onClick={() => setSelectedHorizon(h.key)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  selectedHorizon === h.key
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                    : "bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/25"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>

          {/* Province */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <span className="text-[10px] text-slate-500 whitespace-nowrap">Provinsi:</span>
            <select
              value={selectedProvince}
              onChange={e => setSelectedProvince(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 text-white text-[11px] font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' width%3D'12' height%3D'12'%3E%3Cpath fill%3D'%2394a3b8' d%3D'M6 8L1 3h10z'%2F%3E%3C%2Fsvg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
              }}
            >
              {PROVINCES.map(p => (
                <option key={p} value={p} className="bg-[#0f172a]">{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">

        {/* Multi-horizon KPI comparison */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Multi-Horizon Projection — {selectedProvince}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {HORIZONS.map(h => {
              const hz = summary?.horizons?.[h.key];
              return (
                <button
                  key={h.key}
                  onClick={() => setSelectedHorizon(h.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedHorizon === h.key
                      ? "border-violet-500/50 bg-violet-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <p className="text-[10px] text-slate-400 mb-1.5">{h.label}</p>
                  {summaryLoading || !hz ? (
                    <div className="space-y-1.5">
                      <div className="h-4 bg-white/10 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-white/10 rounded animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <p className="text-[16px] font-bold font-mono" style={{ color: threat.color }}>
                        {hz.projected_value.toFixed(1)}
                      </p>
                      <p className="text-[9px] text-slate-500 mb-1">{threat.unit}</p>
                      <TrendBadge trend={hz.trend} pct={hz.pct_change} />
                      <p className="text-[9px] text-slate-500 mt-1.5">Conf {hz.confidence}% · MAPE {hz.mape.toFixed(1)}%</p>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main forecast chart */}
        <div className="bg-[#0f172a]/80 border border-white/10 rounded-xl p-5 relative overflow-hidden shadow-xl">
          <div
            className="absolute inset-0 opacity-[0.04] rounded-xl pointer-events-none"
            style={{ background: `radial-gradient(circle at 80% 20%, ${threat.color}, transparent 55%)` }}
          />
          <div className="relative">
            {/* Chart header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{threat.icon}</span>
                  <div>
                    <p className="text-[13px] font-bold text-white leading-tight">{threat.label}</p>
                    <p className="text-[10px] text-slate-500">{threat.desc}</p>
                  </div>
                  {forecastData && <BQMLBadge ready={forecastData.bqml_ready} />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {forecastData?.history_days}D Historical + {forecastData?.horizon_days}D Forecast ·
                  Provinsi: <span className="text-slate-300">{selectedProvince}</span> ·
                  Unit: <span className="text-slate-300">{threat.unit}</span>
                </p>
              </div>
              {forecastData && !loading && (
                <div className="text-right shrink-0">
                  <TrendBadge trend={forecastData.trend} pct={forecastData.pct_change} />
                  <p className="text-[9px] text-slate-500 mt-1.5">
                    {forecastData.current_value.toFixed(1)} → {forecastData.projected_value.toFixed(1)} {threat.unit}
                  </p>
                </div>
              )}
            </div>

            {/* Chart */}
            {loading ? (
              <div className="h-[240px] flex flex-col items-center justify-center gap-3">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce"
                      style={{ background: threat.color, animationDelay: `${i*0.15}s` }} />
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-mono animate-pulse">Running forecast model…</p>
              </div>
            ) : mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gHist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id={`gFcast-${selectedThreat}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={threat.color} stopOpacity={0.45}/>
                      <stop offset="95%" stopColor={threat.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 8, fill: "#64748b" }}
                    tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={d => {
                      if (!d) return "";
                      const pts = d.split("-");
                      return pts.length >= 3 ? `${pts[2]}/${pts[1]}` : d;
                    }}
                  />
                  <YAxis tick={{ fontSize: 8, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  {forecastData?.history?.length && (
                    <ReferenceLine
                      x={forecastData.history[forecastData.history.length - 1]?.date}
                      stroke="#334155" strokeDasharray="4 2"
                      label={{ value: "Today", position: "insideTopRight", fontSize: 8, fill: "#475569" }}
                    />
                  )}
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2}
                    fill="url(#gHist)" dot={false} name="Historical" connectNulls={false} />
                  <Area type="monotone" dataKey="forecast_val" stroke={threat.color} strokeWidth={2.5}
                    strokeDasharray="6 3" fill={`url(#gFcast-${selectedThreat})`}
                    dot={false} name="ARIMA Forecast" connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}

            {/* Chart legend */}
            <div className="flex gap-5 mt-2 pt-2 border-t border-white/5">
              {[
                { color: "#8b5cf6", label: "Historical Data", dash: false },
                { color: threat.color, label: "ARIMA+ Projection", dash: true },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <svg width="24" height="4">
                    <line x1="0" y1="2" x2="24" y2="2" stroke={l.color} strokeWidth="2"
                      strokeDasharray={l.dash ? "5 2" : undefined} />
                  </svg>
                  <span className="text-[9px] text-slate-500">{l.label}</span>
                </div>
              ))}
              <span className="ml-auto text-[9px] text-slate-600 font-mono">
                Shaded area = 95% Confidence Interval
              </span>
            </div>
          </div>
        </div>

        {/* Model quality metrics */}
        {forecastData && !loading && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Model Quality Metrics (Industry Standard)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MetricCard label="Confidence" value={`${forecastData.confidence}%`} sub="Forecast Reliability"
                color={forecastData.confidence > 80 ? "#10b981" : forecastData.confidence > 65 ? "#f59e0b" : "#ef4444"} />
              <MetricCard label="MAPE" value={`${forecastData.mape.toFixed(1)}%`} sub="Mean Abs % Error"
                color={forecastData.mape < 8 ? "#10b981" : forecastData.mape < 15 ? "#f59e0b" : "#ef4444"} />
              <MetricCard label="AIC" value={forecastData.aic} sub="Akaike Info Criterion" color="#8b5cf6" />
              <MetricCard label="R²" value={forecastData.r_squared.toFixed(3)} sub="Goodness of Fit"
                color={forecastData.r_squared > 0.85 ? "#10b981" : "#f59e0b"} />
            </div>
          </div>
        )}

        {/* BQML Configuration */}
        {forecastData && !loading && (
          <div className="bg-[#0f172a] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              BigQuery ARIMA+ Configuration
            </p>
            <div className="space-y-2 text-[11px]">
              {[
                ["BQML Forecast Table", forecastData.bqml_table],
                ["Source Data Table",   forecastData.data_source],
                ["Primary Column",      THREATS.find(t=>t.slug===forecastData.threat)?.desc ?? "—"],
                ["Province Filter",     selectedProvince],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center gap-4">
                  <span className="text-slate-500 shrink-0">{k}</span>
                  <span className="text-slate-300 font-mono text-[10px] truncate text-right">{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Model Status</span>
                <BQMLBadge ready={forecastData.bqml_ready} />
              </div>
            </div>
            {!forecastData.bqml_ready && (
              <div className="mt-3 p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                <p className="text-amber-400 text-[10px] font-semibold mb-1">⚠️ Awaiting BigQuery ARIMA+ Table</p>
                <p className="text-amber-500/70 text-[9px]">
                  Currently using statistical fallback (Holt-Winters simulation). Once your BigQuery ARIMA+ table
                  <code className="font-mono mx-1">{forecastData.bqml_table.split(".").pop()}</code>
                  is created, flip <code className="font-mono">BQML_READY["{forecastData.threat}"] = True</code> in
                  <code className="font-mono"> backend/features/forecasting/router.py</code>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Forecast data table */}
        {forecastData && !loading && forecastData.forecast.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Forecast Values — {HORIZONS.find(h=>h.key===selectedHorizon)?.label} · {selectedProvince}
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    {["Date", `Forecast (${threat.unit})`, "Lower 95% CI", "Upper 95% CI"].map(h => (
                      <th key={h} className={`px-3 py-2 text-slate-400 font-semibold ${h==="Date"?"text-left":"text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {forecastData.forecast.slice(0, 12).map((pt, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-3 py-1.5 text-slate-300 font-mono">{pt.date}</td>
                      <td className="px-3 py-1.5 text-right font-bold font-mono" style={{ color: threat.color }}>
                        {pt.value?.toFixed(1)}
                      </td>
                      <td className="px-3 py-1.5 text-right text-slate-500 font-mono">{pt.lower?.toFixed(1)}</td>
                      <td className="px-3 py-1.5 text-right text-slate-500 font-mono">{pt.upper?.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
