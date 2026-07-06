import { NextResponse } from "next/server";

const PROVINCES = [
  { name: "Sumatera Selatan", lat: -3.3194, lon: 103.9144 },
  { name: "Kalimantan Tengah", lat: -1.6815, lon: 113.3824 },
  { name: "Kalimantan Barat", lat: -0.2787, lon: 111.4753 },
  { name: "Riau", lat: 0.2933, lon: 101.7068 },
  { name: "Jawa Timur", lat: -7.5361, lon: 112.2384 },
  { name: "Jambi", lat: -1.6116, lon: 103.6131 },
  { name: "Kalimantan Selatan", lat: -3.0926, lon: 115.2838 },
  { name: "Papua", lat: -4.2699, lon: 138.0804 },
];

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function generateAirQuality() {
  const rand = seededRand(55);
  const now = new Date().toISOString();
  const basePm25 = 165;
  return PROVINCES.map(st => {
    const pm25 = Math.round((basePm25 + (rand() - 0.5) * 120) * 10) / 10;
    const pm10 = Math.round(pm25 * (1.3 + rand() * 0.5) * 10) / 10;
    const co = Math.round((0.8 + rand() * 2.7) * 100) / 100;
    const no2 = Math.round(25 + rand() * 95);
    const o3 = Math.round(40 + rand() * 140);
    const aqi = Math.min(500, Math.round(pm25 * 1.8 + (rand() - 0.5) * 30));
    const cat =
      aqi >= 301 ? "Hazardous" :
      aqi >= 201 ? "Very Unhealthy" :
      aqi >= 151 ? "Unhealthy" :
      aqi >= 101 ? "Unhealthy for Sensitive" :
      aqi >= 51  ? "Moderate" : "Good";
    return {
      station: st.name, lat: st.lat, lon: st.lon,
      pm25, pm10, co_ppm: co, no2_ppb: no2, o3_ppb: o3,
      aqi, aqi_category: cat,
      source: "Wildfire El Niño 2026",
      updated_at: now,
    };
  });
}

let _cache: ReturnType<typeof generateAirQuality> | null = null;
let _cacheTime = 0;

export async function GET() {
  const now = Date.now();
  if (!_cache || now - _cacheTime > 300_000) {
    _cache = generateAirQuality();
    _cacheTime = now;
  }
  return NextResponse.json(_cache);
}
