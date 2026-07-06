import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

ISLAND_REGIONS = [
    {"name":"Jawa Barat","lat":-6.9039,"lon":107.6186,"kota":"Jawa"},
    {"name":"Jawa Tengah","lat":-7.1500,"lon":110.1403,"kota":"Jawa"},
    {"name":"Jawa Timur","lat":-7.5361,"lon":112.2384,"kota":"Jawa"},
    {"name":"Sumatera Selatan","lat":-3.3194,"lon":103.9144,"kota":"Sumatera"},
    {"name":"Riau","lat":0.2933,"lon":101.7068,"kota":"Sumatera"},
    {"name":"Sumatera Utara","lat":2.1154,"lon":99.5451,"kota":"Sumatera"},
    {"name":"Kalimantan Tengah","lat":-1.6815,"lon":113.3824,"kota":"Kalimantan"},
    {"name":"Kalimantan Barat","lat":-0.2787,"lon":111.4753,"kota":"Kalimantan"},
    {"name":"Kalimantan Selatan","lat":-3.0926,"lon":115.2838,"kota":"Kalimantan"},
    {"name":"Sulawesi Selatan","lat":-3.6687,"lon":119.9740,"kota":"Sulawesi"},
    {"name":"Sulawesi Tengah","lat":-1.4300,"lon":121.4456,"kota":"Sulawesi"},
    {"name":"Papua","lat":-4.2699,"lon":138.0804,"kota":"Papua"},
    {"name":"Maluku","lat":-3.2385,"lon":130.1453,"kota":"Maluku"},
    {"name":"Nusa Tenggara Timur","lat":-8.6574,"lon":121.0794,"kota":"Nusa Tenggara"},
    {"name":"Nusa Tenggara Barat","lat":-8.6529,"lon":117.3616,"kota":"Nusa Tenggara"},
    {"name":"Bali","lat":-8.3405,"lon":115.0920,"kota":"Bali"},
]

CATEGORIES = [
    {"cat":"Wildfire","severity":5,"ti":3},
    {"cat":"Disease Outbreak","severity":5,"ti":2},
    {"cat":"Critical Reservoir","severity":4,"ti":2},
    {"cat":"Drought","severity":5,"ti":2},
    {"cat":"Depleted Groundwater","severity":4,"ti":2},
    {"cat":"Severe Pollution","severity":4,"ti":3},
    {"cat":"Waste Accumulation","severity":3,"ti":3},
    {"cat":"Dried River","severity":4,"ti":1},
    {"cat":"Crop Failure","severity":5,"ti":1},
]

DESCS = [
    "Peatland fires expanding near residential areas",
    "ARI and diarrhea outbreak spiking at local clinics",
    "Reservoir water levels critically low, clean water supply threatened",
    "Extreme drought, residents walk 5km for water",
    "Boreholes completely dry, groundwater depleted",
    "Extremely dense smog, visibility under 50 meters",
    "Uncollected waste causing foul odor and disease risk during dry season",
    "Main river flow completely dry, sanitation activities halted",
    "Dozens of hectares of rice fields failed due to lack of irrigation",
]

# ── El Niño: Indonesia Provinces for drought/fire data ─────────────────────
INDONESIA_PROVINCES = [
    {"name": "Kalimantan Tengah", "lat": -1.6815, "lon": 113.3824, "drought_base": 8.2, "fire_base": 13, "avg_karhutla_area": 64464.05},
    {"name": "Kalimantan Barat", "lat": -0.2787, "lon": 111.4753, "drought_base": 7.1, "fire_base": 33, "avg_karhutla_area": 49114.15},
    {"name": "Kalimantan Selatan", "lat": -3.0926, "lon": 115.2838, "drought_base": 7.8, "fire_base": 6, "avg_karhutla_area": 44788.9},
    {"name": "Kalimantan Timur", "lat": 1.6407, "lon": 116.4194, "drought_base": 6.5, "fire_base": 21, "avg_karhutla_area": 18757.67},
    {"name": "Sumatera Selatan", "lat": -3.3194, "lon": 103.9144, "drought_base": 7.5, "fire_base": 16, "avg_karhutla_area": 62558.31},
    {"name": "Riau", "lat": 0.2933, "lon": 101.7068, "drought_base": 6.8, "fire_base": 11, "avg_karhutla_area": 21916.72},
    {"name": "Jambi", "lat": -1.6101, "lon": 103.6131, "drought_base": 7.0, "fire_base": 4, "avg_karhutla_area": 9365.63},
    {"name": "Sumatera Utara", "lat": 2.1154, "lon": 99.5451, "drought_base": 4.5, "fire_base": 3, "avg_karhutla_area": 8273.73},
    {"name": "Sulawesi Selatan", "lat": -3.6687, "lon": 119.9740, "drought_base": 6.2, "fire_base": 64, "avg_karhutla_area": 4314.4},
    {"name": "Nusa Tenggara Timur", "lat": -8.6574, "lon": 121.0794, "drought_base": 9.1, "fire_base": 38, "avg_karhutla_area": 99789.82},
    {"name": "Nusa Tenggara Barat", "lat": -8.6529, "lon": 117.3616, "drought_base": 8.5, "fire_base": 13, "avg_karhutla_area": 45518.43},
    {"name": "Jawa Barat", "lat": -6.9039, "lon": 107.6186, "drought_base": 5.5, "fire_base": 0, "avg_karhutla_area": 4114.96},
    {"name": "Jawa Tengah", "lat": -7.1500, "lon": 110.1403, "drought_base": 5.8, "fire_base": 5, "avg_karhutla_area": 3511.19},
    {"name": "Jawa Timur", "lat": -7.5361, "lon": 112.2384, "drought_base": 6.0, "fire_base": 32, "avg_karhutla_area": 17770.19},
    {"name": "DKI Jakarta", "lat": -6.2088, "lon": 106.8456, "drought_base": 4.8, "fire_base": 0, "avg_karhutla_area": 0.06},
    {"name": "Papua", "lat": -4.2699, "lon": 138.0804, "drought_base": 3.2, "fire_base": 3, "avg_karhutla_area": 20284.34},
    {"name": "Sulawesi Tengah", "lat": -1.4300, "lon": 121.4456, "drought_base": 5.0, "fire_base": 3, "avg_karhutla_area": 5438.57},
    {"name": "Aceh", "lat": 4.6951, "lon": 96.7494, "drought_base": 4.0, "fire_base": 7, "avg_karhutla_area": 3379.48},
    {"name": "Papua Selatan", "lat": -7.6369, "lon": 139.7336, "drought_base": 3.0, "fire_base": 108, "avg_karhutla_area": 23335.85},
    {"name": "Bangka Belitung", "lat": -2.3134, "lon": 106.1116, "drought_base": 5.5, "fire_base": 12, "avg_karhutla_area": 1930.82},
    {"name": "Maluku", "lat": -3.2385, "lon": 130.1453, "drought_base": 4.5, "fire_base": 14, "avg_karhutla_area": 19820.91},
    {"name": "Maluku Utara", "lat": 1.5000, "lon": 127.6000, "drought_base": 4.5, "fire_base": 13, "avg_karhutla_area": 510.17},
]

# Update INDONESIA_PROVINCES dynamically if files exist
try:
    import json
    import os
    _base_dir = os.path.dirname(os.path.abspath(__file__))
    _hotspot_path = os.path.join(_base_dir, "..", "..", "data", "status_resiko_hotspot_lengkap.json")
    _area_path = os.path.join(_base_dir, "..", "..", "data", "rata_rata_luas_karhutla_2018-2026.jsonl")

    if os.path.exists(_hotspot_path):
        _hotspot_data = json.load(open(_hotspot_path, 'r', encoding='utf-8'))
        _hotspot_map = {item['provinsi']: item for item in _hotspot_data}
    else:
        _hotspot_map = {}
        
    _area_map = {}
    if os.path.exists(_area_path):
        with open(_area_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    item = json.loads(line)
                    _area_map[item['provinsi']] = item['rata_rata_luas_karhutla_8_tahun_terakhir']

    for prov in INDONESIA_PROVINCES:
        p_name = prov["name"]
        if p_name in _hotspot_map:
            prov["fire_base"] = _hotspot_map[p_name]["jumlah_counter"]
            # You can also add status_resiko here if needed
            prov["status_resiko"] = _hotspot_map[p_name]["status_resiko"]
        if p_name in _area_map:
            prov["avg_karhutla_area"] = _area_map[p_name]
            
except Exception as e:
    print(f"Warning: could not load realtime data from JSON: {e}")


JAKARTA_STATIONS = [
    {"name":"Jakarta Pusat","lat":-6.1744,"lon":106.8294},
    {"name":"Jakarta Utara","lat":-6.1381,"lon":106.8616},
    {"name":"Jakarta Selatan","lat":-6.2615,"lon":106.8106},
    {"name":"Jakarta Timur","lat":-6.2250,"lon":106.9004},
    {"name":"Jakarta Barat","lat":-6.1674,"lon":106.7632},
    {"name":"Tangerang","lat":-6.1702,"lon":106.6402},
    {"name":"Bekasi","lat":-6.2349,"lon":106.9896},
    {"name":"Depok","lat":-6.4025,"lon":106.7942},
]

RESERVOIRS = [
    {"name":"Jatiluhur","province":"Jawa Barat","capacity_mcm":3000,"critical_pct":30,"lat":-6.5326,"lon":107.3702},
    {"name":"Saguling","province":"Jawa Barat","capacity_mcm":875,"critical_pct":25,"lat":-6.9147,"lon":107.3747},
    {"name":"Cirata","province":"Jawa Barat","capacity_mcm":2165,"critical_pct":28,"lat":-6.8265,"lon":107.3530},
    {"name":"Katulampa","province":"Jawa Barat","capacity_mcm":4.5,"critical_pct":35,"lat":-6.6442,"lon":106.8482},
    {"name":"Riam Kanan","province":"Kalimantan Selatan","capacity_mcm":1100,"critical_pct":30,"lat":-3.2001,"lon":115.2801},
    {"name":"Batutegi","province":"Lampung","capacity_mcm":680,"critical_pct":25,"lat":-5.4298,"lon":104.8101},
]

def generate_complaints(seed=42):
    np.random.seed(seed); random.seed(seed)
    r = lambda a: a[np.random.randint(len(a))]
    rng = lambda a,b: np.random.uniform(a,b)
    statuses = ["Open","Open","Open","In Progress","In Progress","Resolved","Escalated"]
    now = datetime.now()
    rows = []
    
    # 20 complaints per island
    islands = ["Jawa", "Sumatera", "Kalimantan", "Papua", "Maluku", "Sulawesi", "Nusa Tenggara", "Bali"]
    
    i = 0
    for island in islands:
        # Find districts in this island
        island_districts = [d for d in ISLAND_REGIONS if d["kota"] == island]
        if not island_districts:
            continue
            
        for _ in range(20):
            d = r(island_districts)
            c = r(CATEGORIES); st = r(statuses)
            days = int(rng(0,30)); up = int(rng(0,30))
            rec = max(0, 1 - days/30)
            score = (c["severity"]*0.35 + c["ti"]*0.30 + rec*0.20 + min(up/20,1)*0.15)*20
            dt = now - timedelta(days=days, hours=int(rng(0,23)))
            rows.append({
                "id":f"ELN-{1000+i}","category":c["cat"],"description":r(DESCS),
                "district":d["name"],"kota":d["kota"],
                "lat":d["lat"]+rng(-1.5,1.5),"lon":d["lon"]+rng(-1.5,1.5),
                "status":st,"upvotes":up,"severity":c["severity"],"traffic_impact":c["ti"],
                "priority_score":round(score,1),"days_ago":days,"reported_at":dt.isoformat(),
            })
            i += 1
            
    return pd.DataFrame(rows).sort_values("priority_score",ascending=False).reset_index(drop=True)

def generate_traffic():
    return [
        {"name":"Jl. Sudirman","lat":-6.2088,"lon":106.8228,"congestion_level":8,"avg_speed_kmh":18,"incident_count":3},
        {"name":"Jl. Thamrin","lat":-6.1944,"lon":106.8229,"congestion_level":9,"avg_speed_kmh":12,"incident_count":4},
        {"name":"Jl. Gatot Subroto","lat":-6.2297,"lon":106.8095,"congestion_level":7,"avg_speed_kmh":22,"incident_count":2},
        {"name":"Tol Dalam Kota","lat":-6.2000,"lon":106.8500,"congestion_level":8,"avg_speed_kmh":20,"incident_count":3},
        {"name":"Jl. MT Haryono","lat":-6.2417,"lon":106.8583,"congestion_level":6,"avg_speed_kmh":30,"incident_count":1},
        {"name":"Jl. TB Simatupang","lat":-6.3167,"lon":106.8000,"congestion_level":6,"avg_speed_kmh":28,"incident_count":2},
        {"name":"Jl. Daan Mogot","lat":-6.1667,"lon":106.7500,"congestion_level":5,"avg_speed_kmh":35,"incident_count":1},
        {"name":"Jl. Bekasi Raya","lat":-6.2167,"lon":106.9500,"congestion_level":7,"avg_speed_kmh":24,"incident_count":2},
        {"name":"Jl. Raya Bogor","lat":-6.3000,"lon":106.8500,"congestion_level":5,"avg_speed_kmh":32,"incident_count":1},
        {"name":"Jl. Mangga Dua","lat":-6.1500,"lon":106.8167,"congestion_level":4,"avg_speed_kmh":38,"incident_count":0},
    ]

def generate_predictions(df: pd.DataFrame):
    np.random.seed(99)
    groups = df.groupby(["district","category"]).size().reset_index(name="count")
    groups = groups.sort_values("count",ascending=False).head(20)
    preds = []
    for _, row in groups.iterrows():
        cat_meta = next((c for c in CATEGORIES if c["cat"]==row["category"]), {"severity":3,"ti":3})
        hist_avg = round(row["count"]/30, 1)
        trend_f = float(np.random.uniform(0.8,1.5))
        pred7 = int(round(hist_avg*7*trend_f))
        trend = "rising" if trend_f>1.15 else ("falling" if trend_f<0.9 else "stable")
        confidence = int(np.random.randint(68,96))
        risk = min(100, int(cat_meta["severity"]*10 + cat_meta["ti"]*8 + (20 if trend_f>1.2 else 0) + row["count"]*0.5))
        preds.append({
            "district":row["district"],"category":row["category"],
            "predicted_complaints_7d":pred7,"confidence":confidence,
            "trend":trend,"risk_score":risk,"historical_avg":hist_avg,
        })
    return sorted(preds, key=lambda x: -x["risk_score"])

def generate_recommendations(df: pd.DataFrame, predictions: list):
    recs = []
    esc = df[(df["status"]=="Escalated") & (df["priority_score"]>=55)].head(3)
    for i, (_, c) in enumerate(esc.iterrows()):
        recs.append({
            "id":f"REC-{i+1:03d}","priority":"critical",
            "action":f"Dispatch emergency team to {c['district']} immediately",
            "rationale":f"Escalated complaint: {c['category']} (score {c['priority_score']}). {c['upvotes']} residents affected. Traffic impact: {c['traffic_impact']}/5.",
            "district":c["district"],"category":c["category"],
            "estimated_impact":f"Resolve {c['upvotes']+8}–{c['upvotes']+15} reports, clear traffic corridor",
            "complaints_affected":int(c["upvotes"])+8,"urgency_hours":2,
        })

    rising = [p for p in predictions if p["trend"]=="rising" and p["risk_score"]>=60][:4]
    for i, p in enumerate(rising):
        recs.append({
            "id":f"REC-{len(recs)+1:03d}",
            "priority":"high" if p["risk_score"]>=80 else "medium",
            "action":f"Preventive inspection for {p['category'].lower()} in {p['district']}",
            "rationale":f"ML model predicts {p['predicted_complaints_7d']} new reports in 7 days (↑ rising trend, confidence {p['confidence']}%). Proactive intervention can cut complaints by ~40%.",
            "district":p["district"],"category":p["category"],
            "estimated_impact":f"Prevent ~{int(p['predicted_complaints_7d']*0.4)} reports, save {int(p['predicted_complaints_7d']*0.4*2.5)}h of team time",
            "complaints_affected":p["predicted_complaints_7d"],"urgency_hours":24,
        })

    dist_open = df[df["status"]=="Open"].groupby("district").size().reset_index(name="count")
    for _, row in dist_open[dist_open["count"]>=8].sort_values("count",ascending=False).head(3).iterrows():
        recs.append({
            "id":f"REC-{len(recs)+1:03d}","priority":"high",
            "action":f"Integrated sweep operation in {row['district']}",
            "rationale":f"{row['count']} open complaints concentrated in {row['district']}. Batch dispatch is 3x more efficient than individual handling.",
            "district":row["district"],"category":"Multiple",
            "estimated_impact":f"Clear {row['count']} backlogs at once, save 60% time vs. individual dispatch",
            "complaints_affected":int(row["count"]),"urgency_hours":12,
        })

    tl = df[(df["category"]=="Broken Traffic Light") & (df["status"]!="Resolved")]
    if len(tl) >= 2:
        recs.append({
            "id":f"REC-{len(recs)+1:03d}","priority":"high",
            "action":f"Emergency repair for {len(tl)} broken traffic lights citywide",
            "rationale":f"{len(tl)} traffic lights offline, creating multi-layered congestion risks across corridors.",
            "district":"Citywide","category":"Broken Traffic Light",
            "estimated_impact":"Reduce city congestion index est. 15–22%, prevent secondary accidents",
            "complaints_affected":len(tl)*12,"urgency_hours":6,
        })

    # El Niño specific recommendations
    elnino_recs = generate_elnino_recommendations(df)
    recs.extend(elnino_recs)

    order = {"critical":0,"high":1,"medium":2,"low":3}
    return sorted(recs, key=lambda x: order[x["priority"]])

def generate_elnino_recommendations(df: pd.DataFrame):
    """Generate El Niño-specific recommendations for drought, fire, and haze."""
    recs = []
    drought_data = generate_drought_index()
    fire_data = generate_fire_hotspots()
    aq_data = generate_air_quality()
    reservoir_data = generate_reservoir_levels()

    # Critical drought provinces
    critical_drought = [d for d in drought_data if d["severity_level"] == "Critical"]
    for i, d in enumerate(critical_drought[:2]):
        recs.append({
            "id":f"EL-{i+1:03d}","priority":"critical",
            "action":f"Emergency water distribution to {d['province']} — Drought Index {d['drought_index']}/10",
            "rationale":f"El Niño 2026: {d['province']} experiencing critical drought. Rainfall only {d['rainfall_pct_normal']}% of normal. {d['population_affected']:,} people affected.",
            "district":d["province"],"category":"Water Shortage / Drought",
            "estimated_impact":f"Reach {d['population_affected']:,} residents, prevent acute water crisis",
            "complaints_affected":d["population_affected"]//100,"urgency_hours":6,
        })

    # High fire provinces
    high_fire_provinces = {}
    for f in fire_data:
        p = f["province"]
        high_fire_provinces[p] = high_fire_provinces.get(p,0) + 1
    top_fire = sorted(high_fire_provinces.items(), key=lambda x: -x[1])[:2]
    for i, (prov, count) in enumerate(top_fire):
        recs.append({
            "id":f"EL-{len(recs)+1:03d}","priority":"critical",
            "action":f"Mobilize Manggala Agni + BPBD to {prov} — {count} active fire spots",
            "rationale":f"Wildfires {prov}: {count} active hotspots detected by SIPONGI satellite. High winds risk massive spread.",
            "district":prov,"category":"Haze / Wildfire Smoke",
            "estimated_impact":f"Extinguish {count} fire spots before spreading, prevent >Rp500M loss",
            "complaints_affected":count*500,"urgency_hours":3,
        })

    # Critical AQI
    critical_aq = [a for a in aq_data if a["aqi_category"] in ["Hazardous","Very Unhealthy"]]
    if critical_aq:
        recs.append({
            "id":f"EL-{len(recs)+1:03d}","priority":"high",
            "action":f"Activate emergency air quality protocol in {len(critical_aq)} Jakarta zones",
            "rationale":f"PM2.5 reached {max(a['pm25'] for a in critical_aq):.0f} µg/m³ ({len(critical_aq)} stations). Schools and outdoor activities MUST be suspended.",
            "district":"DKI Jakarta","category":"Haze / Wildfire Smoke",
            "estimated_impact":"Protect 10M+ residents from hazardous PM2.5 exposure",
            "complaints_affected":10000000,"urgency_hours":12,
        })

    # Critical reservoir
    critical_res = [r for r in reservoir_data if r["current_pct"] <= r["critical_pct"] + 5]
    if critical_res:
        recs.append({
            "id":f"EL-{len(recs)+1:03d}","priority":"high",
            "action":f"Water usage restriction at {critical_res[0]['name']} Reservoir — level {critical_res[0]['current_pct']:.0f}%",
            "rationale":f"Reservoir {critical_res[0]['name']} at {critical_res[0]['current_pct']:.0f}% capacity, near critical limit of {critical_res[0]['critical_pct']}%. El Niño 2026 accelerating depletion.",
            "district":critical_res[0]["province"],"category":"Water Shortage / Drought",
            "estimated_impact":"Extend water availability by 30–45 days, avoid city water crisis",
            "complaints_affected":5000000,"urgency_hours":24,
        })

    return recs

def compute_summary(df: pd.DataFrame):
    cat_counts = df["category"].value_counts()
    dist_counts = df["district"].value_counts()
    return {
        "total_complaints":len(df),
        "open_complaints":int((df["status"]=="Open").sum()),
        "escalated_complaints":int((df["status"]=="Escalated").sum()),
        "resolved_complaints":int((df["status"]=="Resolved").sum()),
        "in_progress_complaints":int((df["status"]=="In Progress").sum()),
        "high_priority_count":int((df["priority_score"]>=60).sum()),
        "avg_priority":round(float(df["priority_score"].mean()),1),
        "top_category":cat_counts.index[0] if len(cat_counts) else "",
        "most_affected_district":dist_counts.index[0] if len(dist_counts) else "",
        "resolution_rate":int(round((df["status"]=="Resolved").sum()/len(df)*100)),
    }

def generate_benchmark():
    return [
        {"dataset_size":1000,"pandas_ms":11.2,"rapids_gpu_ms":9.3,"speedup":1.2},
        {"dataset_size":10000,"pandas_ms":54.8,"rapids_gpu_ms":16.1,"speedup":3.4},
        {"dataset_size":50000,"rapids_gpu_ms":29.4,"pandas_ms":221.0,"speedup":7.5},
        {"dataset_size":100000,"pandas_ms":448.3,"rapids_gpu_ms":49.3,"speedup":9.1},
        {"dataset_size":500000,"pandas_ms":2318.6,"rapids_gpu_ms":152.5,"speedup":15.2},
    ]

# ── El Niño Data Generators ──────────────────────────────────────────────────

def generate_drought_index(seed=42):
    """Generate drought severity index per Indonesian province based on El Niño 2026."""
    np.random.seed(seed)
    now = datetime.now()
    results = []
    for p in INDONESIA_PROVINCES:
        base = p["drought_base"]
        # Add El Niño amplification (2026 is strong El Niño year)
        elnino_factor = np.random.uniform(0.85, 1.15)
        drought_idx = round(min(10.0, base * elnino_factor), 1)
        rainfall_pct = round(max(5.0, 100 - drought_idx * 8.5 + np.random.uniform(-5, 5)), 1)
        ndvi = round(max(0.05, 0.65 - drought_idx * 0.06 + np.random.uniform(-0.03, 0.03)), 2)
        temp_anomaly = round(drought_idx * 0.4 + np.random.uniform(0.5, 2.0), 1)
        pop_base = {"Kalimantan Tengah":2700000,"Kalimantan Barat":5400000,
                    "Kalimantan Selatan":4200000,"Kalimantan Timur":3900000,
                    "Sumatera Selatan":8700000,"Riau":6900000,"Jambi":3600000,
                    "Sumatera Utara":15000000,"Sulawesi Selatan":9200000,
                    "Nusa Tenggara Timur":5600000,"Nusa Tenggara Barat":5400000,
                    "Jawa Barat":50000000,"Jawa Tengah":37000000,"Jawa Timur":41000000,
                    "DKI Jakarta":11000000,"Papua":3800000,"Sulawesi Tengah":3100000,
                    "Aceh":5500000}
        pop = pop_base.get(p["name"], 3000000)
        pop_affected = int(pop * (drought_idx / 10) * np.random.uniform(0.3, 0.7))

        if drought_idx >= 8.0:
            severity = "Critical"
        elif drought_idx >= 6.5:
            severity = "Severe"
        elif drought_idx >= 5.0:
            severity = "Moderate"
        elif drought_idx >= 3.0:
            severity = "Warning"
        else:
            severity = "Normal"

        results.append({
            "province": p["name"],
            "lat": p["lat"],
            "lon": p["lon"],
            "drought_index": drought_idx,
            "severity_level": severity,
            "rainfall_pct_normal": rainfall_pct,
            "ndvi": ndvi,
            "temp_anomaly_c": temp_anomaly,
            "population_affected": pop_affected,
            "days_without_rain": int(drought_idx * 9 + np.random.randint(0, 15)),
            "updated_at": now.isoformat(),
        })
    return sorted(results, key=lambda x: -x["drought_index"])


def generate_fire_hotspots(seed=77):
    """Generate active fire hotspot data across Indonesia (SIPONGI-style)."""
    np.random.seed(seed)
    hotspots = []
    hid = 1
    for prov in INDONESIA_PROVINCES:
        n_hotspots = int(prov["fire_base"]) # Exact number from real data
        for _ in range(n_hotspots):
            lat = prov["lat"] + np.random.uniform(-2.5, 2.5)
            lon = prov["lon"] + np.random.uniform(-2.5, 2.5)
            confidence = np.random.choice(["High","Medium","Low"], p=[0.5,0.35,0.15])
            frp = round(np.random.uniform(10, 800), 1)  # Fire Radiative Power MW
            days_ago = np.random.randint(0, 3)
            detected_at = (datetime.now() - timedelta(days=days_ago, hours=np.random.randint(0,23))).isoformat()
            hotspots.append({
                "id": f"HS-{hid:05d}",
                "province": prov["name"],
                "lat": round(lat, 4),
                "lon": round(lon, 4),
                "confidence": confidence,
                "frp_mw": frp,
                "land_type": np.random.choice(["Peatland","Secondary Forest","Plantation","Shrub"], p=[0.4,0.3,0.2,0.1]),
                "days_ago": days_ago,
                "detected_at": detected_at,
            })
            hid += 1
    return hotspots


def generate_air_quality(seed=55):
    """Generate air quality (PM2.5, AQI) per Jakarta monitoring station."""
    np.random.seed(seed)
    results = []
    # Base PM2.5 elevated due to El Niño karhutla smoke (150-280 range = Sangat Tidak Sehat / Berbahaya)
    base_pm25 = 165.0
    for station in JAKARTA_STATIONS:
        pm25 = round(base_pm25 + np.random.uniform(-40, 80), 1)
        pm10 = round(pm25 * np.random.uniform(1.3, 1.8), 1)
        co = round(np.random.uniform(0.8, 3.5), 2)
        no2 = round(np.random.uniform(25, 120), 1)
        o3 = round(np.random.uniform(40, 180), 1)

        # AQI calculation (simplified US EPA method)
        aqi = int(min(500, pm25 * 1.8 + np.random.uniform(-10, 20)))

        if aqi >= 301:
            cat = "Hazardous"
        elif aqi >= 201:
            cat = "Very Unhealthy"
        elif aqi >= 151:
            cat = "Unhealthy"
        elif aqi >= 101:
            cat = "Unhealthy for Sensitive"
        elif aqi >= 51:
            cat = "Moderate"
        else:
            cat = "Good"

        results.append({
            "station": station["name"],
            "lat": station["lat"],
            "lon": station["lon"],
            "pm25": pm25,
            "pm10": pm10,
            "co_ppm": co,
            "no2_ppb": no2,
            "o3_ppb": o3,
            "aqi": aqi,
            "aqi_category": cat,
            "source": "Wildfire El Niño 2026",
            "updated_at": datetime.now().isoformat(),
        })
    return results


def generate_reservoir_levels(seed=33):
    """Generate reservoir water level data during El Niño drought."""
    np.random.seed(seed)
    results = []
    for res in RESERVOIRS:
        # El Niño 2026: reservoirs at 30-65% capacity (below normal 70-90%)
        current_pct = round(np.random.uniform(28, 62), 1)
        volume_mcm = round(res["capacity_mcm"] * current_pct / 100, 1)
        days_to_critical = max(0, int((current_pct - res["critical_pct"]) * 3.2 + np.random.randint(-5, 10)))
        inflow = round(np.random.uniform(0.5, 8.0), 1)  # m3/s
        outflow = round(np.random.uniform(12.0, 45.0), 1)  # m3/s (high demand, low supply)
        status = "Critical" if current_pct <= res["critical_pct"] + 3 else (
                  "Warning" if current_pct <= res["critical_pct"] + 15 else "Normal")
        results.append({
            "name": res["name"],
            "province": res["province"],
            "lat": res["lat"],
            "lon": res["lon"],
            "capacity_mcm": res["capacity_mcm"],
            "current_volume_mcm": volume_mcm,
            "current_pct": current_pct,
            "critical_pct": res["critical_pct"],
            "status": status,
            "inflow_m3s": inflow,
            "outflow_m3s": outflow,
            "days_to_critical": days_to_critical,
            "updated_at": datetime.now().isoformat(),
        })
    return sorted(results, key=lambda x: x["current_pct"])


def generate_enso_history(seed=11):
    """Generate ENSO ONI index history 2020-2026 showing El Niño progression."""
    np.random.seed(seed)
    records = []
    # ONI values: positive = El Niño, negative = La Niña
    # Based on real NOAA ENSO pattern: La Niña 2020-2022, El Niño 2023-2026
    monthly_oni = {
        "2020-01": -0.9, "2020-02": -0.8, "2020-03": -0.6, "2020-04": -0.2,
        "2020-05": 0.1, "2020-06": 0.4, "2020-07": 0.5, "2020-08": 0.4,
        "2020-09": 0.0, "2020-10": -0.6, "2020-11": -1.1, "2020-12": -1.4,
        "2021-01": -1.5, "2021-02": -1.3, "2021-03": -1.0, "2021-04": -0.7,
        "2021-05": -0.4, "2021-06": -0.1, "2021-07": -0.2, "2021-08": -0.4,
        "2021-09": -0.7, "2021-10": -1.0, "2021-11": -1.2, "2021-12": -1.0,
        "2022-01": -1.0, "2022-02": -1.0, "2022-03": -0.9, "2022-04": -0.8,
        "2022-05": -0.5, "2022-06": -0.3, "2022-07": -0.2, "2022-08": -0.5,
        "2022-09": -0.8, "2022-10": -1.1, "2022-11": -1.0, "2022-12": -0.9,
        "2023-01": -0.5, "2023-02": -0.2, "2023-03": 0.1, "2023-04": 0.4,
        "2023-05": 0.8, "2023-06": 1.1, "2023-07": 1.4, "2023-08": 1.8,
        "2023-09": 2.0, "2023-10": 2.1, "2023-11": 2.0, "2023-12": 1.9,
        "2024-01": 1.7, "2024-02": 1.3, "2024-03": 0.9, "2024-04": 0.5,
        "2024-05": 0.1, "2024-06": -0.2, "2024-07": -0.5, "2024-08": -0.6,
        "2024-09": -0.5, "2024-10": -0.4, "2024-11": -0.3, "2024-12": -0.1,
        "2025-01": 0.2, "2025-02": 0.5, "2025-03": 0.8, "2025-04": 1.1,
        "2025-05": 1.4, "2025-06": 1.7, "2025-07": 1.9, "2025-08": 2.1,
        "2025-09": 2.3, "2025-10": 2.4, "2025-11": 2.3, "2025-12": 2.2,
        "2026-01": 2.1, "2026-02": 2.0, "2026-03": 1.9, "2026-04": 1.8,
        "2026-05": 1.7, "2026-06": 1.6,
    }
    for month_str, oni in monthly_oni.items():
        year, mo = month_str.split("-")
        phase = "El Niño" if oni >= 0.5 else ("La Niña" if oni <= -0.5 else "Neutral")
        strength = ""
        if abs(oni) >= 2.0:
            strength = "Very Strong"
        elif abs(oni) >= 1.5:
            strength = "Strong"
        elif abs(oni) >= 1.0:
            strength = "Moderate"
        elif abs(oni) >= 0.5:
            strength = "Weak"
        records.append({
            "month": month_str,
            "year": int(year),
            "month_num": int(mo),
            "oni_index": oni,
            "phase": phase,
            "strength": strength,
            "is_elnino": oni >= 0.5,
            "is_lanina": oni <= -0.5,
        })
    return records


def get_elnino_summary():
    """Compute a high-level El Niño dashboard summary."""
    drought = generate_drought_index()
    fire = generate_fire_hotspots()
    aq = generate_air_quality()
    reservoir = generate_reservoir_levels()
    enso = generate_enso_history()

    critical_drought = len([d for d in drought if d["severity_level"] == "Kritis"])
    parah_drought = len([d for d in drought if d["severity_level"] == "Parah"])
    total_hotspots = len(fire)
    high_confidence_fire = len([f for f in fire if f["confidence"] == "High"])
    avg_pm25 = round(sum(a["pm25"] for a in aq) / len(aq), 1)
    worst_aqi = max(aq, key=lambda a: a["aqi"])
    critical_reservoirs = len([r for r in reservoir if r["status"] == "Kritis"])
    current_oni = enso[-1]["oni_index"] if enso else 0
    total_pop_affected = sum(d["population_affected"] for d in drought)

    return {
        "oni_index": current_oni,
        "enso_phase": enso[-1]["phase"] if enso else "Netral",
        "enso_strength": enso[-1]["strength"] if enso else "",
        "drought_critical_provinces": critical_drought,
        "drought_parah_provinces": parah_drought,
        "total_fire_hotspots": total_hotspots,
        "high_confidence_hotspots": high_confidence_fire,
        "avg_pm25_jakarta": avg_pm25,
        "worst_aqi_station": worst_aqi["station"],
        "worst_aqi_value": worst_aqi["aqi"],
        "worst_aqi_category": worst_aqi["aqi_category"],
        "critical_reservoirs": critical_reservoirs,
        "total_population_affected": total_pop_affected,
        "alert_level": "EMERGENCY" if (critical_drought >= 3 or total_hotspots > 500 or avg_pm25 > 200) else "STANDBY",
    }
