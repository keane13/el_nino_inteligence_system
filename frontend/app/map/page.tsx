"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import KPIBar from "@/components/KPIBar";
import TriageList from "@/components/TriageList";
import DetailDrawer from "@/components/DetailDrawer";
import type { Complaint, Summary, Recommendation, Prediction, DroughtData, FireHotspot, AirQuality, ReservoirLevel, ElNinoSummary } from "@/lib/data";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false, loading: () => (
  <div className="w-full h-full flex items-center justify-center bg-[#0d1117]">
    <div className="text-slate-500 text-sm">Loading map…</div>
  </div>
)});

export default function Home() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [elninoSummary, setElninoSummary] = useState<ElNinoSummary | null>(null);
  const [drought, setDrought] = useState<DroughtData[]>([]);
  const [hotspots, setHotspots] = useState<FireHotspot[]>([]);
  const [aqi, setAqi] = useState<AirQuality[]>([]);
  const [reservoirs, setReservoirs] = useState<ReservoirLevel[]>([]);
  
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number; zoom: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, s, es, d, f, a, r] = await Promise.all([
          fetch("/api/complaints?limit=500").then(res => res.json()),
          fetch("/api/complaints?type=summary").then(res => res.json()),
          fetch("/api/elnino/summary").then(res => res.json()),
          fetch("/api/drought").then(res => res.json()),
          fetch("/api/fire-hotspots?limit=1000").then(res => res.json()),
          fetch("/api/air-quality").then(res => res.json()),
          fetch("/api/reservoir").then(res => res.json()),
        ]);
        setComplaints(c);
        setSummary(s);
        setElninoSummary(es);
        setDrought(d);
        setHotspots(f);
        setAqi(a);
        setReservoirs(r);
      } catch (e) {
        console.error("Load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectComplaint = useCallback((c: Complaint) => {
    setSelectedComplaint(c);
    setFlyTo({ lat: c.lat, lon: c.lon, zoom: 15 });
  }, []);

  const criticalCount = elninoSummary?.alert_level === "EMERGENCY" ? (elninoSummary.drought_critical_provinces + elninoSummary.critical_reservoirs) : 0;
  const risingCount = elninoSummary ? elninoSummary.high_confidence_hotspots : 0;

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg)] gap-5">
        <div className="text-[26px] font-bold tracking-tight text-white">
          El Niño Crisis<span className="text-violet-400">Intelligence </span>
        </div>
        <div className="text-[12px] text-slate-400 -mt-2">Crisis Intelligence Platform</div>
        <div className="w-48 h-1 bg-[var(--border)] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full animate-pulse w-full" />
        </div>
        <div className="text-[11px] text-slate-500 font-mono">Loading BigQuery + ML pipeline…</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="flex items-center justify-between px-5 h-[52px] bg-[var(--surface)] border-b border-[var(--border)] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-bold tracking-tight text-white">Overview</span>
        </div>

        <KPIBar summary={summary} elnino={elninoSummary} />

        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              🚨 {criticalCount} Critical
            </div>
          )}
          {risingCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              🔥 {risingCount} Hotspots (High)
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Triage Sidebar */}
        <aside className="w-[340px] shrink-0 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-lg">
          <TriageList
            complaints={complaints}
            drought={drought}
            hotspots={hotspots}
            aqi={aqi}
            reservoirs={reservoirs}
            selectedId={selectedComplaint?.id || null}
            onSelect={handleSelectComplaint}
          />
        </aside>

        {/* Map View */}
        <div className="flex-1 relative overflow-hidden bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg">
          <Suspense>
            <MapView
              complaints={complaints}
              drought={drought}
              hotspots={hotspots}
              aqi={aqi}
              reservoirs={reservoirs}
              selectedId={selectedComplaint?.id || null}
              flyTo={flyTo}
              onSelect={handleSelectComplaint}
            />
          </Suspense>

          {/* Map legend */}
          <div className="absolute top-4 right-4 z-[9999] bg-[#020617]/80 backdrop-blur-md shadow-lg border border-white/10 rounded-xl p-3 text-[11px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Priority</p>
            {[
              { col: "#ef4444", label: "High (≥60)" },
              { col: "#f59e0b", label: "Medium (45–59)" },
              { col: "#3b82f6", label: "Low (<45)" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 mb-1.5 text-slate-200 font-medium">
                <div style={{ background: l.col, borderRadius: "50%", width: 10, height: 10, flexShrink: 0, boxShadow: `0 0 8px ${l.col}` }} />
                {l.label}
              </div>
            ))}
          </div>

          <DetailDrawer complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
        </div>
      </div>
    </div>
  );
}
