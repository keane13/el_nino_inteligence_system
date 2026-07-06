"use client";
import { useState, useEffect } from "react";
import type { DroughtData, FireHotspot, AirQuality, ReservoirLevel, EnsoRecord, ElNinoSummary } from "@/lib/data";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

const AQI_COLOR = (aqi: number) => {
  if (aqi >= 301) return "#7e0023";
  if (aqi >= 201) return "#8f3f97";
  if (aqi >= 151) return "#ff0000";
  if (aqi >= 101) return "#ff7e00";
  if (aqi >= 51) return "#ffff00";
  return "#00e400";
};

const DROUGHT_COLOR = (severity: string) => {
  switch (severity) {
    case "Critical": return "#dc2626";
    case "Severe": return "#ea580c";
    case "Moderate": return "#d97706";
    case "Warning": return "#ca8a04";
    default: return "#16a34a";
  }
};

const RESERVOIR_COLOR = (status: string) => {
  switch (status) {
    case "Critical": return "#ef4444";
    case "Warning": return "#f59e0b";
    default: return "#10b981";
  }
};

export default function WarRoom() {
  const [summary, setSummary] = useState<ElNinoSummary | null>(null);
  const [drought, setDrought] = useState<DroughtData[]>([]);
  const [fire, setFire] = useState<FireHotspot[]>([]);
  const [airQuality, setAirQuality] = useState<AirQuality[]>([]);
  const [reservoir, setReservoir] = useState<ReservoirLevel[]>([]);
  const [enso, setEnso] = useState<EnsoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [sum, d, f, aq, r, e] = await Promise.all([
          fetch("/api/elnino/summary").then(res => res.json()),
          fetch("/api/drought").then(res => res.json()),
          fetch("/api/fire-hotspots?limit=500").then(res => res.json()),
          fetch("/api/air-quality").then(res => res.json()),
          fetch("/api/reservoir").then(res => res.json()),
          fetch("/api/enso").then(res => res.json()),
        ]);
        setSummary(sum);
        setDrought(d);
        setFire(f);
        setAirQuality(aq);
        setReservoir(r);
        setEnso(e);
      } catch (e) {
        console.error("War Room load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, [tick]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg)] gap-5">
        <div className="text-[26px] font-bold tracking-tight text-white">
          El Niño <span className="text-orange-400">War Room</span>
        </div>
        <div className="text-[12px] text-slate-400 -mt-2">Loading crisis data…</div>
        <div className="w-48 h-1 bg-[var(--border)] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse w-full" />
        </div>
        <div className="text-[11px] text-slate-500 font-mono">Fetching BMKG + SIPONGI + AQMS data…</div>
      </div>
    );
  }

  // Province fire summary
  const fireSummary: Record<string, number> = {};
  fire.forEach(h => { fireSummary[h.province] = (fireSummary[h.province] || 0) + 1; });
  const topFireProvinces = Object.entries(fireSummary)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([province, count]) => ({ province: province.replace("Kalimantan", "Kal.").replace("Sumatera", "Sum."), count }));

  const ensoChartData = enso.slice(-24).map(e => ({ month: e.month.slice(2), oni: e.oni_index, phase: e.phase }));
  const top5Drought = drought.slice(0, 5);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--bg)]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 h-[52px] bg-[var(--surface)] border-b border-[var(--border)] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-bold tracking-tight text-white">🌡️ El Niño 2026 War Room</span>
          {summary && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              summary.alert_level === "EMERGENCY"
                ? "bg-red-500/20 border-red-500/40 text-red-400"
                : "bg-amber-500/20 border-amber-500/40 text-amber-400"
            }`}>
              🚨 {summary.alert_level}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {summary && (
            <>
              <div className="text-[11px] text-slate-400 font-mono">
                ONI: <span className="text-orange-400 font-bold">{summary.oni_index.toFixed(1)}</span> ({summary.enso_phase} {summary.enso_strength})
              </div>
              <div className="text-[11px] text-slate-400">
                {(summary.total_population_affected / 1000000).toFixed(1)}M people affected
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
      </header>

      {/* KPI Strip */}
      {summary && (
        <div className="flex gap-px border-b border-[var(--border)] shrink-0 bg-[var(--border)]">
          {[
            { label: "ONI Index", val: summary.oni_index.toFixed(1), sub: summary.enso_phase, color: "#f97316" },
            { label: "Critical Drought", val: `${summary.drought_critical_provinces} prov`, sub: `+${summary.drought_parah_provinces} severe`, color: "#dc2626" },
            { label: "Fire Hotspot", val: summary.total_fire_hotspots.toLocaleString(), sub: `${summary.high_confidence_hotspots} high conf`, color: "#f97316" },
            { label: "PM2.5 Jakarta", val: `${summary.avg_pm25_jakarta}`, sub: summary.worst_aqi_category, color: AQI_COLOR(summary.worst_aqi_value) },
            { label: "Critical Reservoirs", val: `${summary.critical_reservoirs}/6`, sub: "reservoir", color: "#3b82f6" },
            { label: "Affected", val: `${(summary.total_population_affected / 1000000).toFixed(1)}M`, sub: "people", color: "#a78bfa" },
          ].map(k => (
            <div key={k.label} className="flex-1 bg-[var(--surface)] px-4 py-2.5 text-center">
              <div className="text-[15px] font-bold font-mono" style={{ color: k.color }}>{k.val}</div>
              <div className="text-[9px] text-slate-300 font-semibold">{k.label}</div>
              <div className="text-[9px] text-slate-500">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 grid-rows-2 gap-4 scrollbar-thin">

        {/* Panel 1: ENSO ONI History */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[12px] font-bold text-white">ENSO ONI Index</div>
              <div className="text-[10px] text-slate-500">2024–2026 | Source: NOAA</div>
            </div>
            <div className="text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-1 rounded-lg">Strong El Niño</div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ensoChartData}>
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#94a3b8' }} interval={3} />
                <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} width={25} domain={[-2, 3]} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', color: '#f8fafc' }}
                  formatter={(v: any) => [`${v} °C`, "ONI"]}
                />
                <ReferenceLine y={0.5} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'El Niño', fontSize: 8, fill: '#f97316' }} />
                <ReferenceLine y={-0.5} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'La Niña', fontSize: 8, fill: '#3b82f6' }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Line type="monotone" dataKey="oni" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 2: Drought Severity */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[12px] font-bold text-white">🏜️ Drought Severity Index</div>
              <div className="text-[10px] text-slate-500">Top 5 Worst Affected Provinces</div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5Drought} layout="vertical">
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                <YAxis dataKey="province" type="category" tick={{ fontSize: 8, fill: '#94a3b8' }} width={95}
                  tickFormatter={(v: string) => v.replace("Kalimantan", "Kal.").replace("Nusa Tenggara", "NT").replace("Sumatera", "Sum.")}
                />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', color: '#f8fafc' }}
                  formatter={(v: any, _: any, props: any) => [
                    `${v}/10 — ${props.payload.severity_level}`,
                    "Drought Index"
                  ]}
                />
                <Bar dataKey="drought_index" radius={[0, 3, 3, 0]}>
                  {top5Drought.map((entry, i) => (
                    <Cell key={i} fill={DROUGHT_COLOR(entry.severity_level)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 3: Fire Hotspot by Province */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[12px] font-bold text-white">🔥 Active Wildfire Hotspots</div>
              <div className="text-[10px] text-slate-500">Total: {fire.length.toLocaleString()} fire spots</div>
            </div>
            <div className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 rounded-lg">
              🔴 {fire.filter(f => f.confidence === "High").length} High Conf
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFireProvinces} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 8, fill: '#94a3b8' }} />
                <YAxis dataKey="province" type="category" tick={{ fontSize: 8, fill: '#94a3b8' }} width={70} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', color: '#f8fafc' }}
                  formatter={(v: any) => [`${v} hotspot`, "Fire Spots"]}
                />
                <Bar dataKey="count" fill="#f97316" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 4: Air Quality (PM2.5) */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[12px] font-bold text-white">🌫️ Air Quality Levels</div>
              <div className="text-[10px] text-slate-500">PM2.5 per province</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1.5">
            {airQuality.sort((a, b) => b.pm25 - a.pm25).map(aq => (
              <div key={aq.station} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/3 border border-white/5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: AQI_COLOR(aq.aqi), boxShadow: `0 0 6px ${AQI_COLOR(aq.aqi)}` }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-slate-200 truncate">{aq.station}</div>
                  <div className="text-[9px] text-slate-500">{aq.aqi_category}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-bold font-mono" style={{ color: AQI_COLOR(aq.aqi) }}>{aq.pm25.toFixed(0)}</div>
                  <div className="text-[8px] text-slate-500">µg/m³</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 5: Reservoir Levels */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[12px] font-bold text-white">💧 Reservoir Levels</div>
              <div className="text-[10px] text-slate-500">% current capacity</div>
            </div>
            <div className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-1 rounded-lg">
              {reservoir.filter(r => r.status === "Critical").length} Critical
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
            {reservoir.map(r => (
              <div key={r.name}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-slate-300 font-medium">{r.name}</span>
                  <span style={{ color: RESERVOIR_COLOR(r.status) }} className="font-bold font-mono">{r.current_pct.toFixed(0)}%</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${r.current_pct}%`, backgroundColor: RESERVOIR_COLOR(r.status), boxShadow: `0 0 8px ${RESERVOIR_COLOR(r.status)}40` }}
                  />
                  {/* Critical threshold line */}
                  <div className="absolute top-0 h-full w-px bg-red-500/60" style={{ left: `${r.critical_pct}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                  <span>{r.status} {r.days_to_critical > 0 ? `• ${r.days_to_critical}h to critical` : ""}</span>
                  <span>Limit: {r.critical_pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 6: Drought province cards */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[12px] font-bold text-white">🌡️ Provincial Status</div>
              <div className="text-[10px] text-slate-500">Drought & affected population</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
            {drought.slice(0, 8).map(d => (
              <div key={d.province} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/3 border border-white/5">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-slate-200 truncate">{d.province}</div>
                  <div className="text-[9px] text-slate-500">
                    Rain: {d.rainfall_pct_normal}% normal • {d.days_without_rain}d dry
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: DROUGHT_COLOR(d.severity_level) + '30', color: DROUGHT_COLOR(d.severity_level), border: `1px solid ${DROUGHT_COLOR(d.severity_level)}40` }}>
                    {d.severity_level}
                  </div>
                  <div className="text-[8px] text-slate-500 mt-0.5">{(d.population_affected / 1000000).toFixed(1)}M people</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
