import { NextResponse } from "next/server";

const RESERVOIRS = [
  { name: "Jatiluhur", province: "Jawa Barat", capacity_mcm: 3000, critical_pct: 30, lat: -6.5326, lon: 107.3702 },
  { name: "Saguling", province: "Jawa Barat", capacity_mcm: 875, critical_pct: 25, lat: -6.9147, lon: 107.3747 },
  { name: "Cirata", province: "Jawa Barat", capacity_mcm: 2165, critical_pct: 28, lat: -6.8265, lon: 107.3530 },
  { name: "Katulampa", province: "Jawa Barat", capacity_mcm: 4.5, critical_pct: 35, lat: -6.6442, lon: 106.8482 },
  { name: "Riam Kanan", province: "Kalimantan Selatan", capacity_mcm: 1100, critical_pct: 30, lat: -3.2001, lon: 115.2801 },
  { name: "Batutegi", province: "Lampung", capacity_mcm: 680, critical_pct: 25, lat: -5.4298, lon: 104.8101 },
];

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function generateReservoir() {
  const rand = seededRand(33);
  const now = new Date().toISOString();
  return RESERVOIRS.map(r => {
    const pct = Math.round((28 + rand() * 34) * 10) / 10;
    const vol = Math.round(r.capacity_mcm * pct / 100 * 10) / 10;
    const dtc = Math.max(0, Math.round((pct - r.critical_pct) * 3.2 + (rand() - 0.5) * 10));
    const inflow = Math.round((0.5 + rand() * 7.5) * 10) / 10;
    const outflow = Math.round((12 + rand() * 33) * 10) / 10;
    const status = pct <= r.critical_pct + 3 ? "Critical" : pct <= r.critical_pct + 15 ? "Warning" : "Normal";
    return {
      name: r.name, province: r.province, lat: r.lat, lon: r.lon,
      capacity_mcm: r.capacity_mcm,
      current_volume_mcm: vol,
      current_pct: pct,
      critical_pct: r.critical_pct,
      status,
      inflow_m3s: inflow,
      outflow_m3s: outflow,
      days_to_critical: dtc,
      updated_at: now,
    };
  }).sort((a, b) => a.current_pct - b.current_pct);
}

let _cache: ReturnType<typeof generateReservoir> | null = null;
let _cacheTime = 0;

export async function GET() {
  const now = Date.now();
  if (!_cache || now - _cacheTime > 600_000) {
    _cache = generateReservoir();
    _cacheTime = now;
  }
  return NextResponse.json(_cache);
}
