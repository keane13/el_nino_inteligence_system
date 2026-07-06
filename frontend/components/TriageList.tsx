"use client";
import { useState, useMemo } from "react";
import { Complaint, DroughtData, FireHotspot, AirQuality, ReservoirLevel } from "@/lib/data";

interface Props {
  complaints: Complaint[];
  drought: DroughtData[];
  hotspots: FireHotspot[];
  aqi: AirQuality[];
  reservoirs: ReservoirLevel[];
  selectedId: string | null;
  onSelect: (item: any) => void;
}

function priorityColor(score: number) {
  if (score >= 60) return "#ef4444";
  if (score >= 45) return "#f59e0b";
  return "#3b82f6";
}

const STATUS_STYLE: Record<string, string> = {
  "Open": "bg-red-500/10 border border-red-500/30 text-red-400",
  "Escalated": "bg-amber-500/10 border border-amber-500/30 text-amber-400",
  "In Progress": "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400",
  "Resolved": "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400",
  "Critical": "bg-red-500/10 border border-red-500/30 text-red-400",
  "Severe": "bg-amber-500/10 border border-amber-500/30 text-amber-400",
  "Very Unhealthy": "bg-purple-500/10 border border-purple-500/30 text-purple-400",
  "Hazardous": "bg-red-600/10 border border-red-600/30 text-red-500",
  "High": "bg-red-500/10 border border-red-500/30 text-red-400",
};

export default function TriageList({ complaints, drought, hotspots, aqi, reservoirs, selectedId, onSelect }: Props) {
  const [filterType, setFilterType] = useState("");
  const [sort, setSort] = useState("priority_score");

  const unifiedList = useMemo(() => {
    const list: any[] = [];
    
    const makeId = (prefix: string, name: string) => `${prefix}-${name.split(' ').map(w => w.substring(0,3).toUpperCase()).join('-')}`;
    
    // Add Complaints
    complaints.forEach(c => {
      list.push({
        _raw: c, type: "Complaint", id: c.id, category: c.category, status: c.status,
        district: c.district, priority_score: c.priority_score
      });
    });

    // Add Drought
    drought.forEach(d => {
      const description = `Drought Index ${d.drought_index.toFixed(2)} - ${d.severity_level}. ${d.rainfall_pct_normal}% normal rainfall.`;
      list.push({
        _raw: { ...d, description }, type: "Drought", id: makeId('DR', d.province), category: "Drought", status: d.severity_level,
        district: d.province, priority_score: d.drought_index * 10
      });
    });

    // Add Hotspots (Grouped by Province)
    const groupedHotspots = new Map<string, {count: number, maxFRP: number, daysAgo: number, lat: number, lon: number}>();
    hotspots.filter(h => h.confidence === "High").forEach(h => {
      if (!groupedHotspots.has(h.province)) {
        groupedHotspots.set(h.province, { count: 0, maxFRP: 0, daysAgo: h.days_ago, lat: h.lat, lon: h.lon });
      }
      const group = groupedHotspots.get(h.province)!;
      group.count += 1;
      if (h.frp_mw > group.maxFRP) group.maxFRP = h.frp_mw;
      if (h.days_ago < group.daysAgo) group.daysAgo = h.days_ago;
    });

    groupedHotspots.forEach((group, province) => {
      list.push({
        _raw: { days_ago: group.daysAgo, description: `${group.count} high-risk active fire spots detected`, province, lat: group.lat, lon: group.lon }, 
        type: "Hotspot", 
        id: makeId('HS', province), 
        category: "Wildfire Hotspot", 
        status: "High",
        district: province, 
        priority_score: Math.min(100, (group.maxFRP / 800) * 100) // normalized against max FRP of ~800
      });
    });

    // Add AQI
    aqi.forEach(a => {
      const description = `AQI: ${a.aqi} - PM2.5: ${a.pm25} µg/m³.`;
      list.push({
        _raw: { ...a, description }, type: "AQI", id: makeId('AQI', a.station), category: "Air Quality", status: a.aqi_category,
        district: a.station, priority_score: Math.min(100, a.aqi / 3) // normalized to 0-100 roughly
      });
    });

    // Add Reservoirs
    reservoirs.forEach(r => {
      const description = `Capacity: ${r.current_pct}%. Drops to critical in ${r.days_to_critical} days.`;
      list.push({
        _raw: { ...r, description }, type: "Reservoir", id: makeId('RES', r.name), category: "Critical Reservoir Level", status: r.status,
        district: r.name, priority_score: 100 - r.current_pct // lower pct = higher priority
      });
    });

    return list;
  }, [complaints, drought, hotspots, aqi, reservoirs]);

  let filtered = unifiedList;
  if (filterType) filtered = filtered.filter(item => item.category === filterType);
  
  filtered.sort((a, b) => {
    if (sort === "priority_score") return b.priority_score - a.priority_score;
    // Just priority for now
    return b.priority_score - a.priority_score;
  });

  const sel = (id: string, value: string, setter: (v: string) => void, options: { value: string; label: string }[]) => (
    <select
      id={id} value={value} onChange={e => setter(e.target.value)}
      className="flex-1 bg-[#020617]/50 border border-white/10 text-slate-300 text-[11px] px-2 py-1.5 rounded-md outline-none focus:border-violet-500 cursor-pointer shadow-sm backdrop-blur-sm"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-red-900/10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-red-400">El Niño Threat Alerts</span>
        <span className="bg-red-600 text-white text-[11px] font-bold font-mono px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]">
          {filtered.length}
        </span>
      </div>

      {/* Filters */}
      <div className="px-3 py-2.5 border-b border-[var(--border)] space-y-2 bg-[#0f172a]/30">
        <div className="flex gap-2">
          {sel("type", filterType, setFilterType, [
            { value: "", label: "All Categories" },
            ...Array.from(new Set(unifiedList.map(item => item.category))).sort().map(cat => ({ value: cat, label: cat }))
          ])}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
        {filtered.slice(0, 150).map(item => {
          const col = priorityColor(item.priority_score);
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item._raw)}
              className={`relative border rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-150 shadow-sm backdrop-blur-md ${
                selectedId === item.id
                  ? "border-violet-500 bg-violet-500/20"
                  : "bg-transparent border-white/5 hover:border-violet-500/30 hover:bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-slate-400">{item.id}</span>
                    {item.type === "Complaint" ? (
                      <span className="text-[8px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Complaint</span>
                    ) : (
                      <span className="text-[8px] font-bold bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Realtime Sensor</span>
                    )}
                  </div>
                  <p className="text-[12px] font-bold text-white leading-tight">{item.category}</p>
                  {item._raw.description && (
                    <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-1 italic">{item._raw.description}</p>
                  )}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[item.status] || "bg-slate-500/10 text-slate-400"}`}>
                  {item.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  📍 {item.district} {item._raw.days_ago !== undefined ? `• ${item._raw.days_ago} d ago` : ''}
                </span>
                <span className="text-[11px] font-mono font-semibold" style={{ color: col }}>
                  {item.type === "Drought" && "Index "}
                  {item.type === "AQI" && "AQI "}
                  {Math.round(item.priority_score)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
