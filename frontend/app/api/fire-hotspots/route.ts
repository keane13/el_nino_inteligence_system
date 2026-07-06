import { NextRequest, NextResponse } from "next/server";

import { INDONESIA_PROVINCES } from "@/lib/data";

const CONFIDENCES = ["High", "High", "High", "Medium", "Medium", "Low"] as const;
const LAND_TYPES = ["Peatland", "Peatland", "Secondary Forest", "Plantation", "Shrub"] as const;

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function generateHotspots() {
  const rand = seededRand(77);
  const hotspots = [];
  let hid = 1;
  const usedCoords = new Set<string>();

  for (const prov of INDONESIA_PROVINCES) {
    const count = Math.round(prov.fire_base * (0.7 + rand() * 0.6));
    for (let i = 0; i < count; i++) {
      let lat, lon, key;
      let attempts = 0;
      do {
        lat = Math.round((prov.lat + (rand() - 0.5) * 0.05) * 10000) / 10000;
        lon = Math.round((prov.lon + (rand() - 0.5) * 0.05) * 10000) / 10000;
        key = `${lat},${lon}`;
        attempts++;
      } while (usedCoords.has(key) && attempts < 10);
      usedCoords.add(key);

      const conf = CONFIDENCES[Math.floor(rand() * CONFIDENCES.length)];
      const frp = Math.round((10 + rand() * 790) * 10) / 10;
      const daysAgo = Math.floor(rand() * 3);
      const detected = new Date(Date.now() - daysAgo * 86400000 - rand() * 23 * 3600000).toISOString();
      hotspots.push({
        id: `HS-${String(hid++).padStart(5, "0")}`,
        province: prov.name,
        lat,
        lon,
        confidence: conf,
        frp_mw: frp,
        land_type: LAND_TYPES[Math.floor(rand() * LAND_TYPES.length)],
        days_ago: daysAgo,
        detected_at: detected,
      });
    }
  }
  return hotspots;
}

let _cache3: ReturnType<typeof generateHotspots> | null = null;
let _cacheTime3 = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const province = searchParams.get("province");
  const confidence = searchParams.get("confidence");
  const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 2000);

  const now = Date.now();
  if (!_cache3 || now - _cacheTime3 > 300_000) {
    _cache3 = generateHotspots();
    _cacheTime3 = now;
  }

  let data = _cache3;
  if (province) data = data.filter(h => h.province.toLowerCase().includes(province.toLowerCase()));
  if (confidence) data = data.filter(h => h.confidence.toLowerCase() === confidence.toLowerCase());
  return NextResponse.json(data.slice(0, limit));
}
