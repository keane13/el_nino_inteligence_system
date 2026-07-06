"use client";
import { useEffect, useRef } from "react";
import { Complaint, DroughtData, FireHotspot, AirQuality, ReservoirLevel, getProvinceRisks, ProvinceRisk } from "@/lib/data";

interface Props {
  complaints: Complaint[];
  drought: DroughtData[];
  hotspots: FireHotspot[];
  aqi: AirQuality[];
  reservoirs: ReservoirLevel[];
  selectedId: string | null;
  flyTo: { lat: number; lon: number; zoom: number } | null;
  onSelect: (item: any) => void;
}

function priorityColor(score: number) {
  if (score >= 60) return "#ef4444";
  if (score >= 45) return "#f59e0b";
  return "#3b82f6";
}

function droughtColor(severity: string) {
  if (severity === "Critical") return "#ef4444";
  if (severity === "Severe") return "#f97316";
  if (severity === "Moderate") return "#f59e0b";
  return "#84cc16";
}

function aqiColor(cat: string) {
  if (cat === "Berbahaya") return "#7e22ce";
  if (cat === "Sangat Tidak Sehat") return "#ef4444";
  if (cat === "Tidak Sehat") return "#f97316";
  if (cat === "Tidak Sehat untuk Sensitif") return "#eab308";
  return "#22c55e";
}

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

export default function MapView({ complaints, drought, hotspots, aqi, reservoirs, flyTo, selectedId, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const layersRef = useRef<import("leaflet").LayerGroup | null>(null);
  const geojsonLayerRef = useRef<import("leaflet").GeoJSON | null>(null);
  
  const provinceRisks = useRef<ProvinceRisk[]>(getProvinceRisks());

  useEffect(() => {
    const loadLeaflet = () => {
      if (!window.L || !mapRef.current) return;
      const L = window.L;
      
      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current, { center: [-2.5, 118.0], zoom: 5 });
        // Google Maps Hybrid
        L.tileLayer("http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}", {
          attribution: "© Google Maps", maxZoom: 19,
        }).addTo(map);
        mapInstanceRef.current = map;
        layersRef.current = L.layerGroup().addTo(map);

        // Fetch and render GeoJSON for provinces
        fetch("/indonesia-prov.geojson")
          .then(res => res.json())
          .then(data => {
            if (!mapInstanceRef.current) return;
            geojsonLayerRef.current = L.geoJSON(data, {
              style: (feature) => {
                const provName = feature?.properties?.Propinsi;
                // find risk for this province
                const risk = provinceRisks.current.find(r => r.province.toUpperCase() === provName?.toUpperCase());
                const color = risk ? risk.color : "#333333";
                return {
                  fillColor: color,
                  weight: 1,
                  opacity: 0.8,
                  color: 'white',
                  fillOpacity: 0.45
                };
              },
              onEachFeature: (feature, layer) => {
                const provName = feature.properties.Propinsi;
                const risk = provinceRisks.current.find(r => r.province.toUpperCase() === provName?.toUpperCase());
                if (risk) {
                  layer.bindTooltip(
                    `<b>Provinsi: ${provName}</b><br>
                    Status: ${risk.status} (Skor: ${risk.score})<br>
                    Suhu Anomali: +${risk.metrics.temp_anomaly}°C<br>
                    Rata2 Karhutla: ${risk.metrics.fire_avg_3yr}<br>
                    Polusi Index: ${risk.metrics.pollution_index}<br>
                    Kasus Kekeringan: ${risk.metrics.drought_cases}`,
                    { className: "jp-tip", direction: "top", sticky: true }
                  );
                }
              }
            }).addTo(mapInstanceRef.current);
          })
          .catch(err => console.error("Failed to load geojson", err));
      }

      const map = mapInstanceRef.current;
      const layerGroup = layersRef.current!;
      layerGroup.clearLayers();

      // 1. Drought layer is now represented by the Province GeoJSON Choropleth

      // 2. Render Hotspots (Small glowing dots)
      const makeId = (prefix: string, name: string) => `${prefix}-${name.split(' ').map(w => w.substring(0,3).toUpperCase()).join('-')}`;
      hotspots.forEach(h => {
        const isSelected = makeId('HS', h.province) === selectedId;
        const sz = isSelected ? 48 : (h.confidence === "High" ? 16 : 10);
        const col = h.confidence === "High" ? "#ef4444" : "#f59e0b";
        const iconHtml = isSelected 
          ? `<div style="width:${sz}px;height:${sz}px;position:relative;z-index:9999;box-sizing:border-box;">
               <div class="animate-ping" style="position:absolute;inset:0;background:${col};border-radius:50%;opacity:0.9;animation-duration:1s;"></div>
               <div style="position:absolute;inset:20%;background:${col};border-radius:50%;border:3px solid white;box-shadow:0 0 20px ${col};box-sizing:border-box;"></div>
             </div>`
          : `<div style="width:${sz}px;height:${sz}px;position:relative;box-sizing:border-box;">
               <div class="animate-ping" style="position:absolute;inset:0;background:${col};border-radius:50%;opacity:0.6;animation-duration:2s;"></div>
               <div style="position:absolute;inset:0;background:${col};border-radius:50%;box-shadow: 0 0 ${sz}px ${col};border:1px solid rgba(255,255,255,0.5);box-sizing:border-box;"></div>
             </div>`;
        const icon = L.divIcon({
          className: `jp-layer-${h.id}`,
          html: iconHtml,
          iconSize: [sz, sz], iconAnchor: [sz/2, sz/2],
        });
        const mk = L.marker([h.lat, h.lon], { icon }).addTo(layerGroup);
        mk.on("click", () => onSelect(h));
        mk.bindTooltip(`<b>Hotspot</b><br>Conf: ${h.confidence} · FRP: ${h.frp_mw}`, { className: "jp-tip", direction: "top" });
      });

      // 3. Render Reservoirs
      reservoirs.forEach(r => {
        const id = makeId('RES', r.name);
        const isSelected = id === selectedId;
        const col = r.status === "Critical" ? "#ef4444" : r.status === "Warning" ? "#f59e0b" : "#3b82f6";
        const sz = isSelected ? 48 : 20;
        const iconHtml = isSelected
          ? `<div style="width:${sz}px;height:${sz}px;position:relative;z-index:9999;box-sizing:border-box;">
               <div class="animate-ping" style="position:absolute;inset:0;background:${col};border-radius:4px;transform:rotate(45deg);opacity:0.9;animation-duration:1s;"></div>
               <div style="position:absolute;inset:20%;background:${col};border:3px solid #fff;border-radius:4px;transform:rotate(45deg);box-shadow:0 0 20px ${col};box-sizing:border-box;"></div>
             </div>`
          : `<div style="width:${sz}px;height:${sz}px;position:relative;box-sizing:border-box;">
               <div class="animate-ping" style="position:absolute;inset:0;background:${col};border-radius:4px;transform:rotate(45deg);opacity:0.6;animation-duration:2.5s;"></div>
               <div style="position:absolute;inset:0;background:${col};border:2px solid #fff;border-radius:4px;transform:rotate(45deg);box-sizing:border-box;"></div>
             </div>`;
        const icon = L.divIcon({
          className: `jp-layer-${id}`,
          html: iconHtml,
          iconSize: [sz, sz], iconAnchor: [sz/2, sz/2],
        });
        const mk = L.marker([r.lat, r.lon], { icon }).addTo(layerGroup);
        mk.on("click", () => onSelect(r));
        mk.bindTooltip(`<b>Waduk ${r.name}</b><br>Volume: ${r.current_pct}% (${r.status})`, { className: "jp-tip", direction: "top" });
      });

      // 4. Render AQI Stations
      aqi.forEach(a => {
        const id = makeId('AQI', a.station);
        const isSelected = id === selectedId;
        const col = aqiColor(a.aqi_category);
        const sz = isSelected ? 48 : 22;
        const iconHtml = isSelected
          ? `<div style="width:${sz}px;height:${sz}px;position:relative;z-index:9999;box-sizing:border-box;">
               <div class="animate-ping" style="position:absolute;inset:0;background:${col};border-radius:50%;opacity:0.9;animation-duration:1s;"></div>
               <div style="position:absolute;inset:20%;background:${col};border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px ${col};box-sizing:border-box;">
                 <div style="width:8px;height:8px;background:#fff;border-radius:50%;"></div>
               </div>
             </div>`
          : `<div style="width:${sz}px;height:${sz}px;position:relative;box-sizing:border-box;">
               <div class="animate-ping" style="position:absolute;inset:0;background:${col};border-radius:50%;opacity:0.6;animation-duration:2.2s;"></div>
               <div style="position:absolute;inset:0;background:${col};border:2px solid rgba(255,255,255,0.8);border-radius:50%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;"><div style="width:6px;height:6px;background:#fff;border-radius:50%;"></div></div>
             </div>`;
        const icon = L.divIcon({
          className: `jp-layer-${id}`,
          html: iconHtml,
          iconSize: [sz, sz], iconAnchor: [sz/2, sz/2],
        });
        const mk = L.marker([a.lat, a.lon], { icon }).addTo(layerGroup);
        mk.on("click", () => onSelect(a));
        mk.bindTooltip(`<b>AQI: ${a.station}</b><br>AQI: ${a.aqi} (${a.aqi_category})`, { className: "jp-tip", direction: "top" });
      });

      // 5. Render Complaints (Standard dots)
      complaints.slice(0, 200).forEach(c => {
        const isSelected = c.id === selectedId;
        const col = priorityColor(c.priority_score);
        const sz = isSelected ? 56 : (c.priority_score >= 60 ? 18 : 12);
        const iconHtml = isSelected
          ? `<div style="width:${sz}px;height:${sz}px;position:relative;z-index:9999;box-sizing:border-box;">
               <div class="animate-ping" style="position:absolute;inset:0;background:${col};border-radius:50%;opacity:0.9;animation-duration:1s;"></div>
               <div style="position:absolute;inset:25%;background:${col};border-radius:50%;border:3px solid white;box-shadow:0 0 25px ${col};box-sizing:border-box;"></div>
             </div>`
          : `<div style="width:${sz}px;height:${sz}px;position:relative;box-sizing:border-box;">
               <div class="animate-ping" style="position:absolute;inset:0;background:${col};border-radius:50%;opacity:0.6;animation-duration:2s;"></div>
               <div style="position:absolute;inset:0;background:${col};border-radius:50%;border:1px solid rgba(255,255,255,.8);box-sizing:border-box;"></div>
             </div>`;
        const icon = L.divIcon({
          className: `jp-layer-${c.id}`,
          html: iconHtml,
          iconSize: [sz, sz], iconAnchor: [sz/2, sz/2],
        });
        const mk = L.marker([c.lat, c.lon], { icon }).addTo(layerGroup);
        mk.on("click", () => onSelect(c));
        mk.bindTooltip(`<b>${c.category}</b><br>${c.district}`, { className: "jp-tip", direction: "top" });
      });
    };

    if (window.L) {
      loadLeaflet();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = loadLeaflet;
      document.head.appendChild(script);
    }
  }, [complaints, drought, hotspots, aqi, reservoirs, onSelect, selectedId]);

  useEffect(() => {
    if (!flyTo || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([flyTo.lat, flyTo.lon], flyTo.zoom, { duration: 0.8 });
  }, [flyTo]);

  useEffect(() => {
    if (!window.document) return;
    document.querySelectorAll('.leaflet-glow').forEach(el => el.classList.remove('leaflet-glow'));
    if (selectedId) {
      const els = document.querySelectorAll(`.jp-layer-${selectedId}`);
      els.forEach(el => el.classList.add('leaflet-glow'));
    }
  }, [selectedId]);

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <style>{`
        .jp-tip { background:#020617!important;border:1px solid rgba(255,255,255,0.1)!important;color:#f8fafc!important;border-radius:6px!important;padding:5px 8px!important;font-size:11px!important;font-family:system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.5)!important; }
        .jp-tip.leaflet-tooltip-top::before { border-top-color:rgba(255,255,255,0.1)!important; }
        .leaflet-control-zoom { border:1px solid rgba(255,255,255,0.1)!important; }
        .leaflet-control-zoom a { background:#020617!important;color:#f8fafc!important;border-color:rgba(255,255,255,0.1)!important; }
        .leaflet-control-zoom a:hover { background:#0f172a!important; }
        
        .leaflet-glow {
          filter: drop-shadow(0 0 10px #fff) drop-shadow(0 0 20px #e879f9) !important;
          transform: scale(1.5) !important;
          z-index: 1000 !important;
          transition: all 0.3s;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full" />
    </>
  );
}
