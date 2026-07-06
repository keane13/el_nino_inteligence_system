// ── Types ─────────────────────────────────────────────────────────────────
export interface Complaint {
  id: string;
  category: string;
  description: string;
  district: string;
  kota: string;
  lat: number;
  lon: number;
  status: "Open" | "Escalated" | "In Progress" | "Resolved";
  upvotes: number;
  severity: number;
  traffic_impact: number;
  priority_score: number;
  days_ago: number;
  reported_at: string;
  polygon?: [number, number][];
  endLat?: number;
  endLon?: number;
}

export interface Prediction {
  district: string;
  category: string;
  predicted_complaints_7d: number;
  confidence: number;
  trend: "rising" | "stable" | "falling";
  risk_score: number;
  historical_avg: number;
  history: number[];
  forecast: number[];
}

export interface Recommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  action: string;
  rationale: string;
  district: string;
  category: string;
  estimated_impact: string;
  complaints_affected: number;
  urgency_hours: number;
}

export interface BenchmarkResult {
  dataset_size: number;
  pandas_ms: number;
  rapids_gpu_ms: number;
  speedup: number;
}

export interface Summary {
  total_complaints: number;
  open_complaints: number;
  escalated_complaints: number;
  resolved_complaints: number;
  in_progress_complaints: number;
  high_priority_count: number;
  avg_priority: number;
  top_category: string;
  most_affected_district: string;
  resolution_rate: number;
}

export const INLAND_CITIES = [
  // Sumatera
  { name: "Medan", prov: "Sumatera Utara", lat: 3.5952, lon: 98.6722, kota: "Sumatera", fire_base: 40 },
  { name: "Pekanbaru", prov: "Riau", lat: 0.5071, lon: 101.4451, kota: "Sumatera", fire_base: 130 },
  { name: "Palembang", prov: "Sumatera Selatan", lat: -2.9761, lon: 104.7754, kota: "Sumatera", fire_base: 160 },
  { name: "Padang", prov: "Sumatera Barat", lat: -0.9471, lon: 100.4172, kota: "Sumatera", fire_base: 30 },
  
  // Jawa
  { name: "Bandung", prov: "Jawa Barat", lat: -6.9147, lon: 107.6098, kota: "Jawa", fire_base: 35 },
  { name: "Semarang", prov: "Jawa Tengah", lat: -6.9667, lon: 110.4167, kota: "Jawa", fire_base: 30 },
  { name: "Surabaya", prov: "Jawa Timur", lat: -7.2504, lon: 112.7688, kota: "Jawa", fire_base: 45 },
  
  // Kalimantan
  { name: "Pontianak", prov: "Kalimantan Barat", lat: -0.0227, lon: 109.3333, kota: "Kalimantan", fire_base: 145 },
  { name: "Palangkaraya", prov: "Kalimantan Tengah", lat: -2.2083, lon: 113.9167, kota: "Kalimantan", fire_base: 180 },
  { name: "Banjarmasin", prov: "Kalimantan Selatan", lat: -3.3167, lon: 114.5900, kota: "Kalimantan", fire_base: 120 },
  { name: "Balikpapan", prov: "Kalimantan Timur", lat: -1.2675, lon: 116.8289, kota: "Kalimantan", fire_base: 95 },
  
  // Sulawesi
  { name: "Makassar", prov: "Sulawesi Selatan", lat: -5.1477, lon: 119.4327, kota: "Sulawesi", fire_base: 55 },
  { name: "Palu", prov: "Sulawesi Tengah", lat: -0.8917, lon: 119.8707, kota: "Sulawesi", fire_base: 50 },
  { name: "Manado", prov: "Sulawesi Utara", lat: 1.4931, lon: 124.8413, kota: "Sulawesi", fire_base: 20 },
  
  // Maluku & Papua
  { name: "Ambon", prov: "Maluku", lat: -3.6958, lon: 128.1814, kota: "Maluku", fire_base: 20 },
  { name: "Jayapura", prov: "Papua", lat: -2.5337, lon: 140.7061, kota: "Papua", fire_base: 20 },
  { name: "Manokwari", prov: "Papua Barat", lat: -0.8615, lon: 134.0620, kota: "Papua", fire_base: 15 },
  
  // Bali & Nusa Tenggara
  { name: "Denpasar", prov: "Bali", lat: -8.6500, lon: 115.2167, kota: "Bali", fire_base: 10 },
  { name: "Mataram", prov: "Nusa Tenggara Barat", lat: -8.5833, lon: 116.1167, kota: "Nusa Tenggara", fire_base: 60 },
  { name: "Kupang", prov: "Nusa Tenggara Timur", lat: -10.1583, lon: 123.5833, kota: "Nusa Tenggara", fire_base: 70 }
];

const CATEGORIES = [
  { cat: "Drought", severity: 5, traffic_impact: 1 },
  { cat: "Wildfire Hotspot", severity: 5, traffic_impact: 3 },
  { cat: "Air Quality", severity: 4, traffic_impact: 2 },
  { cat: "Extreme Temperature", severity: 4, traffic_impact: 1 },
  { cat: "Critical Reservoir Level", severity: 5, traffic_impact: 1 },
  { cat: "Depleted Groundwater", severity: 4, traffic_impact: 1 },
  { cat: "ARI Cases", severity: 4, traffic_impact: 2 },
  { cat: "Food Security", severity: 5, traffic_impact: 1 },
  { cat: "PDAM Water Capacity", severity: 4, traffic_impact: 2 },
];

const DESCRIPTIONS = [
  "Clean water crisis report, supply stopped in residential areas",
  "New fire spots detected growing due to wind",
  "Air pollution reached unhealthy limits (High PM2.5)",
  "Heat wave triggered temperatures above 38 degrees celsius",
  "Reservoir capacity shrank drastically, emergency pumps activated",
  "Citizen borewells dried up, need clean water dropping",
  "Surge in ARI/respiratory patients in health facilities",
  "Potential crop failures (puso) observed expanding",
  "PDAM pipe water distribution stopped due to low source debit",
];

const POP_MAP: Record<string, number> = {
  "Kalimantan Tengah": 2700000, "Kalimantan Barat": 5400000,
  "Kalimantan Selatan": 4200000, "Kalimantan Timur": 3900000,
  "Sumatera Selatan": 8700000, "Riau": 6900000, "Jambi": 3600000,
  "Sumatera Utara": 15000000, "Sulawesi Selatan": 9200000,
  "Nusa Tenggara Timur": 5600000, "Nusa Tenggara Barat": 5400000,
  "Jawa Barat": 50000000, "Jawa Tengah": 37000000, "Jawa Timur": 41000000,
  "DKI Jakarta": 11000000, "Papua": 3800000, "Sulawesi Tengah": 3100000, "Aceh": 5500000,
};

export const INDONESIA_PROVINCES = [
  { name: "Kalimantan Tengah", lat: -1.6815, lon: 113.3824, drought_base: 8.2, fire_base: 13, avg_karhutla_area: 64464.05 },
  { name: "Kalimantan Barat", lat: -0.2787, lon: 111.4753, drought_base: 7.1, fire_base: 33, avg_karhutla_area: 49114.15 },
  { name: "Kalimantan Selatan", lat: -3.0926, lon: 115.2838, drought_base: 7.8, fire_base: 6, avg_karhutla_area: 44788.9 },
  { name: "Kalimantan Timur", lat: 1.6407, lon: 116.4194, drought_base: 6.5, fire_base: 21, avg_karhutla_area: 18757.67 },
  { name: "Sumatera Selatan", lat: -3.3194, lon: 103.9144, drought_base: 7.5, fire_base: 16, avg_karhutla_area: 62558.31 },
  { name: "Riau", lat: 0.2933, lon: 101.7068, drought_base: 6.8, fire_base: 11, avg_karhutla_area: 21916.72 },
  { name: "Jambi", lat: -1.6101, lon: 103.6131, drought_base: 7.0, fire_base: 4, avg_karhutla_area: 9365.63 },
  { name: "Sumatera Utara", lat: 2.1154, lon: 99.5451, drought_base: 4.5, fire_base: 3, avg_karhutla_area: 8273.73 },
  { name: "Sulawesi Selatan", lat: -3.6687, lon: 119.9740, drought_base: 6.2, fire_base: 64, avg_karhutla_area: 4314.4 },
  { name: "Nusa Tenggara Timur", lat: -8.6574, lon: 121.0794, drought_base: 9.1, fire_base: 38, avg_karhutla_area: 99789.82 },
  { name: "Nusa Tenggara Barat", lat: -8.6529, lon: 117.3616, drought_base: 8.5, fire_base: 13, avg_karhutla_area: 45518.43 },
  { name: "Jawa Barat", lat: -6.9039, lon: 107.6186, drought_base: 5.5, fire_base: 0, avg_karhutla_area: 4114.96 },
  { name: "Jawa Tengah", lat: -7.1500, lon: 110.1403, drought_base: 5.8, fire_base: 5, avg_karhutla_area: 3511.19 },
  { name: "Jawa Timur", lat: -7.5361, lon: 112.2384, drought_base: 6.0, fire_base: 32, avg_karhutla_area: 17770.19 },
  { name: "DKI Jakarta", lat: -6.2088, lon: 106.8456, drought_base: 4.8, fire_base: 0, avg_karhutla_area: 0.06 },
  { name: "Papua", lat: -4.2699, lon: 138.0804, drought_base: 3.2, fire_base: 3, avg_karhutla_area: 20284.34 },
  { name: "Sulawesi Tengah", lat: -1.4300, lon: 121.4456, drought_base: 5.0, fire_base: 3, avg_karhutla_area: 5438.57 },
  { name: "Aceh", lat: 4.6951, lon: 96.7494, drought_base: 4.0, fire_base: 7, avg_karhutla_area: 3379.48 },
  { name: "Papua Selatan", lat: -7.6369, lon: 139.7336, drought_base: 3.0, fire_base: 108, avg_karhutla_area: 23335.85 },
  { name: "Bangka Belitung", lat: -2.3134, lon: 106.1116, drought_base: 5.5, fire_base: 12, avg_karhutla_area: 1930.82 },
  { name: "Maluku", lat: -3.2385, lon: 130.1453, drought_base: 4.5, fire_base: 14, avg_karhutla_area: 19820.91 },
  { name: "Maluku Utara", lat: 1.5000, lon: 127.6000, drought_base: 4.5, fire_base: 13, avg_karhutla_area: 510.17 },
];

const seededRand = (seed: number) => {
  return () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
};

export function getDroughtData(): DroughtData[] {
  const rand = seededRand(42);
  const now = new Date("2026-07-05T00:00:00.000Z").toISOString();
  return INDONESIA_PROVINCES.map(p => {
    const factor = 0.85 + rand() * 0.30;
    const di = Math.min(10, Math.round(p.drought_base * factor * 10) / 10);
    const rainfall = Math.max(5, Math.round((100 - di * 8.5 + (rand() - 0.5) * 10) * 10) / 10);
    const ndvi = Math.max(0.05, Math.round((0.65 - di * 0.06 + (rand() - 0.5) * 0.06) * 100) / 100);
    const tempAnomaly = Math.round((di * 0.4 + 0.5 + rand() * 1.5) * 10) / 10;
    const pop = POP_MAP[p.name] || 3000000;
    const popAffected = Math.round(pop * (di / 10) * (0.3 + rand() * 0.4));
    const severity = (di >= 8 ? "Critical" : di >= 6.5 ? "Severe" : di >= 5 ? "Moderate" : di >= 3 ? "Warning" : "Normal") as "Critical" | "Severe" | "Moderate" | "Warning" | "Normal";
    return {
      province: p.name, lat: p.lat, lon: p.lon,
      drought_index: di, severity_level: severity,
      rainfall_pct_normal: rainfall, ndvi, temp_anomaly_c: tempAnomaly,
      population_affected: popAffected,
      days_without_rain: Math.round(di * 9 + rand() * 15),
      updated_at: now,
    };
  }).sort((a, b) => b.drought_index - a.drought_index);
}

// ── Data generators ───────────────────────────────────────────────────────
export function generateComplaints(n = 160): Complaint[] {
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const rng = (a: number, b: number) => rand() * (b - a) + a;

  const statuses: Complaint["status"][] = [
    "Open", "Open", "Open", "In Progress", "In Progress", "Resolved", "Escalated",
  ];
  const islands = ["Jawa", "Sumatera", "Kalimantan", "Papua", "Maluku", "Sulawesi", "Nusa Tenggara", "Bali"];
  const now = new Date("2026-07-05T12:00:00Z");
  const complaints: Complaint[] = [];
  
  let i = 0;
  for (const island of islands) {
    const island_districts = INLAND_CITIES.filter(d => d.kota === island);
    if (island_districts.length === 0) continue;
    
    // Track unique locations to prevent duplicates in the same pixel
    const usedCoords = new Set<string>();
    const SUFFIXES = ["Utara", "Selatan", "Timur", "Barat", "Pusat", "Permai", "Raya", "Indah"];
    
    for (let j = 0; j < 20; j++) {
      const d = pick(island_districts);
      const c = pick(CATEGORIES);
      const status = pick(statuses);
      const days = Math.floor(rng(0, 30));
      const upvotes = Math.floor(rng(0, 30));
      const recency = Math.max(0, 1 - days / 30);
      const score = (c.severity * 0.35 + c.traffic_impact * 0.30 + recency * 0.20 + Math.min(upvotes / 20, 1) * 0.15) * 20;
      const dt = new Date(now.getTime() - days * 86400000 - Math.floor(rng(0, 23)) * 3600000);

      // find a unique coordinate around the city to avoid piling up
      let lat, lon, key;
      let attempts = 0;
      do {
        lat = Math.round((d.lat + rng(-0.015, 0.015)) * 10000) / 10000;
        lon = Math.round((d.lon + rng(-0.015, 0.015)) * 10000) / 10000;
        key = `${lat},${lon}`;
        attempts++;
      } while (usedCoords.has(key) && attempts < 10);
      usedCoords.add(key);

      const catIndex = CATEGORIES.findIndex(x => x.cat === c.cat);
      const desc = catIndex !== -1 ? DESCRIPTIONS[catIndex] : DESCRIPTIONS[0];

      complaints.push({
        id: `ELN-${1000 + i}`,
        category: c.cat,
        description: desc + ` (Report day ${days})`,
        district: d.prov,
        kota: d.prov,
        lat: lat,
        lon: lon,
        status,
        upvotes,
        severity: c.severity,
        traffic_impact: c.traffic_impact,
        priority_score: Math.round(score * 10) / 10,
        days_ago: days,
        reported_at: dt.toISOString(),
      });
      i++;
    }
  }
  
  return complaints.sort((a, b) => b.priority_score - a.priority_score);
}

// ── Province Risk Analytics ────────────────────────────────────────────────
export interface ProvinceRisk {
  province: string;
  score: number;
  color: string;
  status: string;
  metrics: {
    temp_anomaly: number;
    fire_avg_3yr: number;
    pollution_index: number;
    drought_cases: number;
  };
}

export function getProvinceRisks(): ProvinceRisk[] {
  let seed = 123;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
  const rng = (a: number, b: number) => rand() * (b - a) + a;

  const provinces = [
    "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi", "Sumatera Selatan", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung", "Kepulauan Riau",
    "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten",
    "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
    "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
    "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat",
    "Maluku", "Maluku Utara",
    "Papua Barat", "Papua"
  ];

  return provinces.map(prov => {
    // Determine base risk based on known El Nino hotspots
    let riskFactor = 0.4;
    if (["Riau", "Sumatera Selatan", "Kalimantan Tengah", "Kalimantan Barat", "Jawa Timur", "Nusa Tenggara Timur"].includes(prov)) {
      riskFactor = rng(0.7, 1.0);
    } else {
      riskFactor = rng(0.2, 0.7);
    }

    const score = Math.round(riskFactor * 100);
    
    let color = "";
    let status = "";
    if (score < 20) { color = "#22c55e"; status = "Good"; } // Hijau
    else if (score < 40) { color = "#eab308"; status = "Fair"; } // Kuning
    else if (score < 60) { color = "#f97316"; status = "Moderate"; } // Orange
    else if (score < 80) { color = "#ec4899"; status = "High"; } // Pink
    else { color = "#ef4444"; status = "Critical"; } // Merah

    return {
      province: prov,
      score,
      color,
      status,
      metrics: {
        temp_anomaly: Math.round(rng(0.5, 2.5) * 10) / 10,
        fire_avg_3yr: Math.round(rng(10, 500) * riskFactor),
        pollution_index: Math.round(rng(30, 150) * riskFactor),
        drought_cases: Math.round(rng(5, 100) * riskFactor)
      }
    };
  });
}

// ── Predictive Analytics (simulated ML) ───────────────────────────────────
export function generatePredictions(complaints: Complaint[]): Prediction[] {
  const holtWinters = (data: number[], alpha = 0.4, beta = 0.2, forecastDays = 7) => {
    let level = data[0];
    let trend = data[1] - data[0];
    let mse = 0;

    for (let i = 1; i < data.length; i++) {
      const lastLevel = level;
      level = alpha * data[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * trend;
      mse += Math.pow(data[i] - level, 2);
    }
    
    const stdDev = Math.sqrt(mse / data.length);
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const cv = stdDev / (mean || 1); 
    const confidence = Math.max(20, Math.min(99, Math.round(100 - cv * 100)));

    let forecastedSum = 0;
    const forecasts = [];
    for (let i = 1; i <= forecastDays; i++) {
      const f = Math.max(0, level + i * trend);
      forecastedSum += f;
      forecasts.push(f);
    }

    return { 
      forecastedSum: Math.round(forecastedSum), 
      forecasts,
      confidence, 
      trendValue: trend, 
      historicalAvg: mean 
    };
  };

  const predictions: Prediction[] = [];
  const getSeed = (str: string) => {
    let h = 0;
    for(let i=0;i<str.length;i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    return h;
  };

  const groups: Record<string, number> = {};
  complaints.forEach(c => {
    const key = `${c.kota}||${c.category}`;
    groups[key] = (groups[key] || 0) + 1;
  });

  const topPairs = Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0, 20);

  topPairs.forEach(([key, totalCount]) => {
    const [district, category] = key.split("||");
    const cat = CATEGORIES.find(c => c.cat === category) || CATEGORIES[0];
    
    let seed = getSeed(key) + 99;
    const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
    const baseDaily = totalCount / 30;
    
    const timeSeries: number[] = [];
    for(let i=0; i<30; i++) {
       let daily = baseDaily * (0.8 + rand() * 0.4);
       
       if (category === "Kapasitas Air PDAM" && (i % 7 === 5 || i % 7 === 6)) daily *= 1.5;
       if (category === "Kasus ISPA" && i > 5 && (i-2) % 14 === 0) daily *= 2.0; 
       if (category === "Hotspot Kebakaran" && i % 10 === 0) daily *= 0.2; 

       timeSeries.push(daily);
    }

    const { forecastedSum, forecasts, confidence, trendValue, historicalAvg } = holtWinters(timeSeries);

    const trendText = trendValue > 0.05 ? "rising" : trendValue < -0.05 ? "falling" : "stable";
    const riskScore = Math.min(100, Math.round(
      cat.severity * 10 + cat.traffic_impact * 5 + (trendValue > 0.1 ? 15 : 0) + totalCount * 0.3
    ));

    predictions.push({
      district,
      category,
      predicted_complaints_7d: forecastedSum,
      confidence,
      trend: trendText,
      risk_score: riskScore,
      historical_avg: Math.round(historicalAvg * 10) / 10,
      history: timeSeries.map(v => Math.round(v * 10) / 10),
      forecast: forecasts.map(v => Math.round(v * 10) / 10),
    });
  });

  return predictions.sort((a, b) => b.risk_score - a.risk_score);
}

// ── Recommendation Engine ─────────────────────────────────────────────────
export function generateRecommendations(
  complaints: Complaint[],
  predictions: Prediction[],
  droughtData: DroughtData[] = []
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Rule 1: Escalated + high priority → immediate dispatch
  const escalated = complaints
    .filter(c => c.status === "Escalated" && c.priority_score >= 50)
    .slice(0, 4);

  const ACTIONS: Record<string, string> = {
    "Drought": "Deploy water dropping fleet",
    "Wildfire Hotspot": "Dispatch fire fighting units",
    "Air Quality": "Distribute N95 masks and purifiers",
    "Extreme Temperature": "Open emergency cooling centers",
    "Critical Reservoir Level": "Activate emergency water pumps",
    "Depleted Groundwater": "Send mobile water tanks",
    "ARI Cases": "Deploy mobile medical clinics",
    "Food Security": "Distribute emergency food supplies",
    "PDAM Water Capacity": "Repair main water distribution pipes"
  };

  escalated.forEach((c, i) => {
    const actionPrefix = ACTIONS[c.category] || "Dispatch emergency response team";
    recommendations.push({
      id: `REC-${String(i + 1).padStart(3, "0")}`,
      priority: "critical",
      action: `${actionPrefix} to ${c.district} immediately`,
      rationale: `Escalation status for ${c.category.toLowerCase()} (Priority Score: ${c.priority_score}). Massive reports affected.`,
      district: c.district,
      category: c.category,
      estimated_impact: `Relieve crisis for ${c.upvotes + 5}–${c.upvotes + 15} directly affected citizens.`,
      complaints_affected: c.upvotes + 8,
      urgency_hours: 2,
    });
  });

  // Rule 2: Rising predictions → preventive action
  const risingPred = predictions.filter(p => p.trend === "rising" && p.risk_score >= 60).slice(0, 3);
  risingPred.forEach((p, i) => {
    const actionPrefix = ACTIONS[p.category] || "Prepare preventive action";
    recommendations.push({
      id: `REC-${String(escalated.length + i + 1).padStart(3, "0")}`,
      priority: p.risk_score >= 80 ? "high" : "medium",
      action: `${actionPrefix} for ${p.district} in advance`,
      rationale: `AI model predicts ${p.predicted_complaints_7d} additional incidents in 7 days (Rising Trend ↑, Confidence ${p.confidence}%). Early intervention is crucial.`,
      district: p.district,
      category: p.category,
      estimated_impact: `Prevent escalation of up to ${Math.round(p.predicted_complaints_7d * 0.4)} further cases, secure resource supply.`,
      complaints_affected: p.predicted_complaints_7d,
      urgency_hours: 24,
    });
  });

  // Rule 3: Cluster of open complaints same district → batch dispatch
  const distCounts: Record<string, Complaint[]> = {};
  complaints
    .filter(c => c.status === "Open")
    .forEach(c => {
      distCounts[c.district] = distCounts[c.district] || [];
      distCounts[c.district].push(c);
    });

  Object.entries(distCounts)
    .filter(([, cs]) => cs.length >= 8)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .forEach(([dist, cs], i) => {
      recommendations.push({
        id: `REC-${String(escalated.length + risingPred.length + i + 1).padStart(3, "0")}`,
        priority: "high",
        action: `Open El Niño Integrated Command Post in ${dist}`,
        rationale: `There are ${cs.length} backlogged open complaints in ${dist}. Main issue: ${cs[0].category}. Centralized handling is 3x more efficient.`,
        district: dist,
        category: "Multiple",
        estimated_impact: `Resolve ${cs.length} backlogged complaints at once.`,
        complaints_affected: cs.length,
        urgency_hours: 12,
      });
    });

  // Rule 4: Critical Hotspots & Fire Risk
  const fireComplaints = complaints.filter(
    c => c.category === "Hotspot Kebakaran" && c.status !== "Resolved"
  );
  if (fireComplaints.length >= 2) {
    recommendations.push({
      id: `REC-${String(recommendations.length + 1).padStart(3, "0")}`,
      priority: "high",
      action: `Aerial Firefighting Operation (Water Bombing)`,
      rationale: `${fireComplaints.length} active fire reports. High smoke and spread risk due to wind.`,
      district: "Multi-Region",
      category: "Hotspot Kebakaran",
      estimated_impact: `Reduce satellite fire spots by up to 70% and lower AQI level to safe limits.`,
      complaints_affected: fireComplaints.length * 15,
      urgency_hours: 4,
    });
  }

  // Rule 5: PDAM Crisis
  const pdamComplaints = complaints.filter(
    c => c.category === "Kapasitas Air PDAM" && c.status !== "Resolved"
  );
  if (pdamComplaints.length >= 2) {
    recommendations.push({
      id: `REC-${String(recommendations.length + 1).padStart(3, "0")}`,
      priority: "high",
      action: `Massive Clean Water Dropping Fleet Mobilization`,
      rationale: `${pdamComplaints.length} areas report PDAM outages. Urgent water needs on the weekend.`,
      district: "Multi-Region",
      category: "Kapasitas Air PDAM",
      estimated_impact: `Restore water supply for ${pdamComplaints.length * 50} households in emergency.`,
      complaints_affected: pdamComplaints.length * 12,
      urgency_hours: 6,
    });
  }

  // Rule 6: Critical El Nino Regions (Segmentasi Daerah)
  droughtData.filter(d => d.severity_level === "Critical").forEach(d => {
    recommendations.push({
      id: `REC-${String(recommendations.length + 1).padStart(3, "0")}`,
      priority: "critical",
      action: `Emergency El Niño Relief Deployment in ${d.province}`,
      rationale: `El Niño regional segmentation categorized as CRITICAL. Drought Index: ${d.drought_index.toFixed(2)}, ${d.days_without_rain} days without rain. Temp Anomaly: +${d.temp_anomaly_c}°C.`,
      district: d.province,
      category: "El Niño Crisis",
      estimated_impact: `Protect ${d.population_affected.toLocaleString("id-ID")} residents from severe drought impacts and food insecurity.`,
      complaints_affected: Math.round(d.population_affected / 15000), // scaled urgency weight
      urgency_hours: 12,
    });
  });

  return recommendations.sort((a, b) => {
    const pVal = { critical: 4, high: 3, medium: 2, low: 1 };
    return pVal[b.priority] - pVal[a.priority];
  }).slice(0, 7);
}

// ── Summary ────────────────────────────────────────────────────────────────
export function computeSummary(complaints: Complaint[]): Summary {
  const open = complaints.filter(c => c.status === "Open").length;
  const escalated = complaints.filter(c => c.status === "Escalated").length;
  const resolved = complaints.filter(c => c.status === "Resolved").length;
  const inProgress = complaints.filter(c => c.status === "In Progress").length;
  const highPri = complaints.filter(c => c.priority_score >= 60).length;
  const avgPri = complaints.reduce((s, c) => s + c.priority_score, 0) / complaints.length;
  const catCounts: Record<string, number> = {};
  const distCounts: Record<string, number> = {};
  complaints.forEach(c => {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    distCounts[c.district] = (distCounts[c.district] || 0) + 1;
  });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const topDist = Object.entries(distCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  return {
    total_complaints: complaints.length,
    open_complaints: open,
    escalated_complaints: escalated,
    resolved_complaints: resolved,
    in_progress_complaints: inProgress,
    high_priority_count: highPri,
    avg_priority: Math.round(avgPri * 10) / 10,
    top_category: topCat,
    most_affected_district: topDist,
    resolution_rate: Math.round((resolved / complaints.length) * 100),
  };
}

// ── Benchmark ─────────────────────────────────────────────────────────────
export function generateBenchmark(): BenchmarkResult[] {
  return [
    { dataset_size: 1_000, pandas_ms: 11.2, rapids_gpu_ms: 9.3, speedup: 1.2 },
    { dataset_size: 10_000, pandas_ms: 54.8, rapids_gpu_ms: 16.1, speedup: 3.4 },
    { dataset_size: 50_000, rapids_gpu_ms: 29.4, pandas_ms: 221.0, speedup: 7.5 },
    { dataset_size: 100_000, pandas_ms: 448.3, rapids_gpu_ms: 49.3, speedup: 9.1 },
    { dataset_size: 500_000, pandas_ms: 2318.6, rapids_gpu_ms: 152.5, speedup: 15.2 },
  ];
}

// ── Trend sparkline data (last 14 days per category) ──────────────────────
export function generateTrendData(complaints: Complaint[]) {
  const days = 14;
  const result: Record<string, number[]> = {};
  const cats = [...new Set(complaints.map(c => c.category))];

  cats.forEach(cat => {
    const series = Array(days).fill(0);
    complaints
      .filter(c => c.category === cat)
      .forEach(c => {
        if (c.days_ago < days) series[days - 1 - c.days_ago]++;
      });
    result[cat] = series;
  });
  return result;
}

// Singleton for consistent data across API routes
let _complaints4: Complaint[] | null = null;
export function getComplaints(): Complaint[] {
  if (!_complaints4) _complaints4 = generateComplaints(160);
  return _complaints4;
}

// ── El Niño Types ──────────────────────────────────────────────────────────
export interface DroughtData {
  province: string;
  lat: number;
  lon: number;
  drought_index: number;
  severity_level: "Critical" | "Severe" | "Moderate" | "Warning" | "Normal";
  rainfall_pct_normal: number;
  ndvi: number;
  temp_anomaly_c: number;
  population_affected: number;
  days_without_rain: number;
  updated_at: string;
}

export interface FireHotspot {
  id: string;
  province: string;
  lat: number;
  lon: number;
  confidence: "High" | "Medium" | "Low";
  frp_mw: number;
  land_type: string;
  days_ago: number;
  detected_at: string;
}

export interface AirQuality {
  station: string;
  lat: number;
  lon: number;
  pm25: number;
  pm10: number;
  co_ppm: number;
  no2_ppb: number;
  o3_ppb: number;
  aqi: number;
  aqi_category: string;
  source: string;
  updated_at: string;
}

export interface ReservoirLevel {
  name: string;
  province: string;
  lat: number;
  lon: number;
  capacity_mcm: number;
  current_volume_mcm: number;
  current_pct: number;
  critical_pct: number;
  status: "Critical" | "Warning" | "Normal";
  inflow_m3s: number;
  outflow_m3s: number;
  days_to_critical: number;
  updated_at: string;
}

export interface EnsoRecord {
  month: string;
  year: number;
  month_num: number;
  oni_index: number;
  phase: string;
  strength: string;
  is_elnino: boolean;
  is_lanina: boolean;
}

export interface ElNinoSummary {
  oni_index: number;
  enso_phase: string;
  enso_strength: string;
  drought_critical_provinces: number;
  drought_parah_provinces: number;
  total_fire_hotspots: number;
  high_confidence_hotspots: number;
  avg_pm25_jakarta: number;
  worst_aqi_station: string;
  worst_aqi_value: number;
  worst_aqi_category: string;
  critical_reservoirs: number;
  total_population_affected: number;
  alert_level: "EMERGENCY" | "WARNING";
}
