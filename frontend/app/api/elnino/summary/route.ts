import { NextResponse } from "next/server";

// Shared seeded random util
function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// Inline mini generators for summary (avoids importing across routes)
function calcDroughtSummary() {
  const rand = seededRand(42);
  const bases = [8.2,7.1,7.8,6.5,7.5,6.8,7.0,4.5,6.2,9.1,8.5,5.5,5.8,6.0,4.8,3.2,5.0,4.0];
  let critical = 0, parah = 0, totalPop = 0;
  const pops = [2700000,5400000,4200000,3900000,8700000,6900000,3600000,15000000,
                9200000,5600000,5400000,50000000,37000000,41000000,11000000,3800000,3100000,5500000];
  bases.forEach((b, i) => {
    const di = Math.min(10, b * (0.85 + rand() * 0.30));
    if (di >= 8) critical++;
    else if (di >= 6.5) parah++;
    totalPop += Math.round(pops[i] * (di / 10) * (0.3 + rand() * 0.4));
  });
  return { critical, parah, totalPop };
}

function calcFireSummary() {
  const rand = seededRand(77);
  const bases = [180,145,120,95,160,130,110,40,55,70,60,35,30,45,15,20,50,35];
  let total = 0, highConf = 0;
  bases.forEach(b => {
    const count = Math.round(b * (0.7 + rand() * 0.6));
    total += count;
    // ~50% high confidence
    highConf += Math.round(count * (0.4 + rand() * 0.2));
  });
  return { total, highConf };
}

function calcAqSummary() {
  const rand = seededRand(55);
  const stations = ["Jakarta Pusat","Jakarta Utara","Jakarta Selatan","Jakarta Timur","Jakarta Barat","Tangerang","Bekasi","Depok"];
  let sumPm25 = 0, maxAqi = 0, worstStation = "", worstCat = "";
  stations.forEach(st => {
    const pm25 = 165 + (rand() - 0.5) * 120;
    const aqi = Math.min(500, Math.round(pm25 * 1.8 + (rand() - 0.5) * 30));
    const cat = aqi >= 301 ? "Hazardous" : aqi >= 201 ? "Very Unhealthy" :
      aqi >= 151 ? "Unhealthy" : aqi >= 101 ? "Unhealthy for Sensitive" : aqi >= 51 ? "Moderate" : "Good";
    sumPm25 += pm25;
    if (aqi > maxAqi) { maxAqi = aqi; worstStation = st; worstCat = cat; }
  });
  return { avgPm25: Math.round(sumPm25 / stations.length * 10) / 10, maxAqi, worstStation, worstCat };
}

function calcReservoirSummary() {
  const rand = seededRand(33);
  const critPcts = [30, 25, 28, 35, 30, 25];
  let critical = 0;
  critPcts.forEach(cp => {
    const pct = 28 + rand() * 34;
    if (pct <= cp + 3) critical++;
  });
  return { critical };
}

export async function GET() {
  const drought = calcDroughtSummary();
  const fire = calcFireSummary();
  const aq = calcAqSummary();
  const res = calcReservoirSummary();

  const alertLevel = (drought.critical >= 3 || fire.total > 800 || aq.avgPm25 > 200) ? "EMERGENCY" : "WARNING";

  return NextResponse.json({
    oni_index: 1.6,
    enso_phase: "El Niño",
    enso_strength: "Kuat",
    drought_critical_provinces: drought.critical,
    drought_parah_provinces: drought.parah,
    total_fire_hotspots: fire.total,
    high_confidence_hotspots: fire.highConf,
    avg_pm25_jakarta: aq.avgPm25,
    worst_aqi_station: aq.worstStation,
    worst_aqi_value: aq.maxAqi,
    worst_aqi_category: aq.worstCat,
    critical_reservoirs: res.critical,
    total_population_affected: drought.totalPop,
    alert_level: alertLevel,
  });
}
