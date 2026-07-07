"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, Legend } from "recharts";
import { Database, GripVertical, Play, X, BarChart3, Info, CheckSquare, Square } from "lucide-react";
import { marked } from "marked";

type ColumnDef = {
  name: string;
  type: "STRING" | "NUMBER" | "DATE";
  tableName?: string;
  tableId?: string;
  agg?: "SUM" | "AVG" | "MAX" | "MIN" | "COUNT";
  uid?: string; // unique id for dragged instance
};

type TableDef = {
  id: string;
  name: string;
  columns: ColumnDef[];
};

const TABLES: TableDef[] = [
  {
    id: "smooth-reason-491707-f6.el_nino.rekap_kejadian_bulanan_2024_2026",
    name: "rekap_kejadian_bulanan_2024_2026",
    columns: [
      { name: "provinsi", type: "STRING" },
      { name: "tahun", type: "NUMBER" },
      { name: "bulan", type: "STRING" },
      { name: "jumlah_kekeringan", type: "NUMBER" },
      { name: "jumlah_kebakaran_gedung_dan_permukiman", type: "NUMBER" },
      { name: "jumlah_kebakaran_hutan_dan_lahan", type: "NUMBER" },
      { name: "jumlah_cuaca_ekstrem", type: "NUMBER" }
    ]
  },
  {
    id: "smooth-reason-491707-f6.el_nino.food_availability_rekap_2025_2026",
    name: "food_availability_rekap_2025_2026",
    columns: [
      { name: "provinsi", type: "STRING" },
      { name: "tahun", type: "NUMBER" },
      { name: "bulan", type: "STRING" },
      { name: "ketersediaan_ton", type: "NUMBER" },
      { name: "kebutuhan_ton", type: "NUMBER" },
      { name: "neraca_ton", type: "NUMBER" },
      { name: "rasio_ketersediaan_kebutuhan_persen", type: "NUMBER" }
    ]
  },
  {
    id: "smooth-reason-491707-f6.el_nino.weather_air_quality_2025_2026",
    name: "weather_air_quality_2025_2026",
    columns: [
      { name: "provinsi", type: "STRING" },
      { name: "tahun", type: "NUMBER" },
      { name: "bulan", type: "STRING" },
      { name: "suhu_celsius", type: "NUMBER" },
      { name: "curah_hujan_mm", type: "NUMBER" },
      { name: "tutupan_awan_oktas", type: "NUMBER" },
      { name: "kualitas_udara_pm25_ugm3", type: "NUMBER" }
    ]
  },
  {
    id: "smooth-reason-491707-f6.el_nino.medical_history_2025_2026_rekap",
    name: "medical_history_2025_2026_rekap",
    columns: [
      { name: "provinsi", type: "STRING" },
      { name: "tahun", type: "NUMBER" },
      { name: "bulan", type: "STRING" },
      { name: "jumlah_kasus_ispa", type: "NUMBER" },
      { name: "jumlah_kasus_diare", type: "NUMBER" }
    ]
  },
  {
    id: "smooth-reason-491707-f6.el_nino.water_supply_2025_2026",
    name: "water_supply_2025_2026",
    columns: [
      { name: "provinsi", type: "STRING" },
      { name: "tahun", type: "NUMBER" },
      { name: "bulan", type: "STRING" }
    ]
  }
];

function getJoinCondition(t1: TableDef, t2: TableDef, t1Alias: string, t2Alias: string) {
  const c1 = t1.columns.map(c => c.name);
  const c2 = t2.columns.map(c => c.name);

  // Since all 5 tables share provinsi, tahun, and bulan, we join on all three to be precise.
  if (c1.includes("provinsi") && c2.includes("provinsi") && c1.includes("tahun") && c2.includes("tahun") && c1.includes("bulan") && c2.includes("bulan")) {
    return `${t1Alias}.provinsi = ${t2Alias}.provinsi AND ${t1Alias}.tahun = ${t2Alias}.tahun AND ${t1Alias}.bulan = ${t2Alias}.bulan`;
  }
  
  if (c1.includes("provinsi") && c2.includes("provinsi")) return `${t1Alias}.provinsi = ${t2Alias}.provinsi`;
  
  return "1=1"; // Fallback
}

export default function DataExplorer() {
  const [selectedTables, setSelectedTables] = useState<TableDef[]>([TABLES[0]]);
  const [dimensions, setDimensions] = useState<ColumnDef[]>([]);
  const [metrics, setMetrics] = useState<ColumnDef[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [generatedQuery, setGeneratedQuery] = useState("");
  
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const toggleTable = (tb: TableDef) => {
    if (selectedTables.some(t => t.name === tb.name)) {
      if (selectedTables.length === 1) return; // Must have at least 1
      setSelectedTables(selectedTables.filter(t => t.name !== tb.name));
      // Remove any dimensions/metrics that belong to this table
      setDimensions(dimensions.filter(d => d.tableName !== tb.name));
      setMetrics(metrics.filter(m => m.tableName !== tb.name));
    } else {
      setSelectedTables([...selectedTables, tb]);
    }
    setData([]);
    setGeneratedQuery("");
  };

  const handleDragStart = (e: React.DragEvent, col: ColumnDef, tb: TableDef) => {
    e.dataTransfer.setData("application/json", JSON.stringify({
      ...col,
      tableName: tb.name,
      tableId: tb.id,
      agg: col.type === "NUMBER" ? "SUM" : "COUNT",
      uid: Math.random().toString(36).substr(2, 9)
    }));
  };

  const handleDrop = (e: React.DragEvent, zone: "dimension" | "metric") => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    
    try {
      const col = JSON.parse(data) as ColumnDef;
      if (zone === "dimension") {
        if (!dimensions.some(d => d.tableName === col.tableName && d.name === col.name)) {
          setDimensions([...dimensions, col]);
        }
      } else {
        if (!metrics.some(m => m.tableName === col.tableName && m.name === col.name)) {
          setMetrics([...metrics, col]);
        }
      }
    } catch (err) {}
  };

  const removeColumn = (zone: "dimension" | "metric", uid: string) => {
    if (zone === "dimension") setDimensions(dimensions.filter(d => d.uid !== uid));
    else setMetrics(metrics.filter(m => m.uid !== uid));
  };

  const updateMetricAgg = (uid: string, newAgg: any) => {
    setMetrics(metrics.map(m => m.uid === uid ? { ...m, agg: newAgg } : m));
  };

  const runQuery = async () => {
    if (dimensions.length === 0 && metrics.length === 0) {
      setError("Please add at least one dimension or metric.");
      return;
    }
    setLoading(true);
    setError("");
    setData([]);
    setAiInsight("");

    // 1. Build Table Aliases Map
    const tableAliasMap: Record<string, string> = {};
    selectedTables.forEach((tb, i) => {
      tableAliasMap[tb.name] = `t${i}`;
    });

    const selects: string[] = [];
    const groupBy: string[] = [];
    
    // 2. Build Dimensions (GROUP BY)
    dimensions.forEach(d => {
      const alias = tableAliasMap[d.tableName || ""];
      const colAlias = `${alias}_${d.name}`;
      selects.push(`${alias}.${d.name} AS ${colAlias}`);
      groupBy.push(`${alias}.${d.name}`);
    });

    // 3. Build Metrics
    metrics.forEach(m => {
      const alias = tableAliasMap[m.tableName || ""];
      const agg = m.agg || "SUM";
      const colAlias = `${agg.toLowerCase()}_${alias}_${m.name}`;
      selects.push(`${agg}(${alias}.${m.name}) AS ${colAlias}`);
    });

    // 4. Build FROM and JOINs
    let fromClause = `FROM \`${selectedTables[0].id}\` t0`;
    for (let i = 1; i < selectedTables.length; i++) {
      const tb = selectedTables[i];
      const prevTb = selectedTables[i - 1]; // Chain joins with previous table
      const alias = `t${i}`;
      const prevAlias = `t${i - 1}`;
      const condition = getJoinCondition(prevTb, tb, prevAlias, alias);
      fromClause += `\nLEFT JOIN \`${tb.id}\` ${alias} ON ${condition}`;
    }

    const selectClause = selects.join(",\n  ");
    const groupByClause = groupBy.length > 0 ? `\nGROUP BY ${groupBy.join(", ")}` : "";

    const query = `SELECT\n  ${selectClause}\n${fromClause}${groupByClause}\nLIMIT 100`;
    setGeneratedQuery(query);

    try {
      const res = await fetch("/api/bigquery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to fetch data");
      setData(result.data);

      if (result.data && result.data.length > 0) {
        setInsightLoading(true);
        try {
          const sample = result.data.slice(0, 10);
          const aiRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Analisis singkat data hasil SQL berikut (berikan insight kuantitatif, maksimal 3 kalimat):\n" + JSON.stringify(sample) })
          });
          const aiData = await aiRes.json();
          if (aiRes.ok && aiData.reply) {
            setAiInsight(aiData.reply);
          }
        } catch (e) {
          console.error("AI Insight error", e);
        } finally {
          setInsightLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#00d4ff","#7c3aed","#ff6b35","#10b981","#f59e0b"];

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar: Tables & Columns */}
      <div className="w-[300px] flex flex-col gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 shrink-0 overflow-y-auto custom-scrollbar">
        <h2 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database size={16} className="text-violet-400" /> Data Source
        </h2>
        
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-[11px] text-slate-400">Select Tables (Max 4)</label>
          <div className="flex flex-col gap-1.5">
            {TABLES.map(t => {
              const isSelected = selectedTables.some(st => st.name === t.name);
              return (
                <div 
                  key={t.name}
                  onClick={() => toggleTable(t)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                    isSelected ? "bg-violet-500/20 border-violet-500/50 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {isSelected ? <CheckSquare size={14} className="text-violet-400 shrink-0"/> : <Square size={14} className="shrink-0"/>}
                  <span className="text-[11px] font-medium truncate">{t.name.replace(/_/g, " ")}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 mb-2 block">Columns (Drag to add)</label>
          <div className="flex flex-col gap-4">
            {selectedTables.map(tb => (
              <div key={tb.name} className="flex flex-col gap-1">
                <div className="text-[10px] font-bold text-violet-300 uppercase tracking-wider border-b border-white/10 pb-1 mb-1 truncate">
                  {tb.name}
                </div>
                {tb.columns.map(col => (
                  <div 
                    key={`${tb.name}-${col.name}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, col, tb)}
                    className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                  >
                    <GripVertical size={14} className="text-slate-500 shrink-0" />
                    <span className="text-[11px] text-slate-200 font-medium truncate">{col.name}</span>
                    <span className="ml-auto text-[9px] font-mono text-slate-500 shrink-0">{col.type}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {/* Drop Zones */}
        <div className="flex gap-4">
          {/* Dimensions */}
          <div 
            className="flex-1 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-4 min-h-[100px] transition-colors hover:border-violet-500/50 flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "dimension")}
          >
            <h3 className="text-[12px] font-bold text-slate-400 mb-3 flex items-center gap-2">
              Dimensions (Group By)
            </h3>
            <div className="flex flex-wrap gap-2 items-start flex-1">
              {dimensions.length === 0 && <span className="text-[12px] text-slate-500 italic mt-1">Drop columns here...</span>}
              {dimensions.map(d => (
                <div key={d.uid} className="bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[11px] px-2 py-1 rounded-md flex items-center gap-2 shadow-sm max-w-full">
                  <span className="opacity-50 truncate max-w-[60px]">{d.tableName?.split("_")[0]}</span>
                  <span className="truncate">{d.name}</span>
                  <button onClick={() => removeColumn("dimension", d.uid!)} className="hover:text-white shrink-0"><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div 
            className="flex-1 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-4 min-h-[100px] transition-colors hover:border-orange-500/50 flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "metric")}
          >
            <h3 className="text-[12px] font-bold text-slate-400 mb-3 flex items-center gap-2">
              Metrics (Values)
            </h3>
            <div className="flex flex-wrap gap-2 items-start flex-1">
              {metrics.length === 0 && <span className="text-[12px] text-slate-500 italic mt-1">Drop columns here...</span>}
              {metrics.map(m => (
                <div key={m.uid} className="bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[11px] p-1 pr-2 rounded-md flex items-center gap-1.5 shadow-sm max-w-full">
                  <select 
                    value={m.agg} 
                    onChange={(e) => updateMetricAgg(m.uid!, e.target.value)}
                    className="bg-orange-900/80 border border-orange-500/50 outline-none text-white text-[10px] font-bold uppercase rounded p-1 cursor-pointer shadow-lg"
                  >
                    <option value="SUM" className="bg-orange-950 text-white">SUM</option>
                    <option value="AVG" className="bg-orange-950 text-white">AVG</option>
                    <option value="MAX" className="bg-orange-950 text-white">MAX</option>
                    <option value="MIN" className="bg-orange-950 text-white">MIN</option>
                    <option value="COUNT" className="bg-orange-950 text-white">COUNT</option>
                  </select>
                  <span className="opacity-50 truncate max-w-[60px]">{m.tableName?.split("_")[0]}</span>
                  <span className="truncate">{m.name}</span>
                  <button onClick={() => removeColumn("metric", m.uid!)} className="hover:text-white shrink-0 ml-1"><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex-1 font-mono text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-24 scrollbar-thin">
            {generatedQuery ? (
              <span className="text-emerald-400">{generatedQuery}</span>
            ) : (
              "Query will appear here..."
            )}
          </div>
          <button 
            onClick={runQuery}
            disabled={loading || (dimensions.length === 0 && metrics.length === 0)}
            className="ml-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-lg text-[13px] font-bold flex items-center gap-2 shadow-lg shadow-violet-500/25 disabled:opacity-50 transition-all shrink-0"
          >
            {loading ? <span className="animate-pulse">Running...</span> : <><Play size={14} /> Run Query</>}
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative min-h-[600px] lg:min-h-[750px]">
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-[12px] z-10">
              {error}
            </div>
          )}

          {data.length > 0 ? (
            <div className="flex-1 w-full h-full flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
                  <BarChart3 size={16} className="text-violet-400"/> Visualization
                </h3>
                <span className="text-[11px] bg-white/5 px-2 py-1 rounded text-slate-400">{data.length} records</span>
              </div>
              <div className="flex-1 w-full min-h-0 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey={dimensions.length > 0 ? `t${selectedTables.findIndex(t => t.name === dimensions[0].tableName)}_${dimensions[0].name}` : Object.keys(data[0] || {})[0]} 
                      stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} 
                      angle={-45} textAnchor="end" dy={15} 
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "12px", fontSize: "12px", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)" }}
                      itemStyle={{ color: "#fff", fontWeight: "bold" }}
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: "11px", paddingBottom: "20px" }} />
                    {metrics.map((m, idx) => {
                      const alias = `t${selectedTables.findIndex(t => t.name === m.tableName)}`;
                      const colKey = `${m.agg?.toLowerCase()}_${alias}_${m.name}`;
                      return (
                        <Bar 
                          key={m.uid} 
                          dataKey={colKey} 
                          name={`${m.agg} ${m.name} (${m.tableName?.split("_")[0]})`}
                          radius={[4,4,0,0]} 
                          barSize={24}
                          fill={COLORS[idx % COLORS.length]}
                        />
                      );
                    })}
                    {/* Fallback if only dimensions selected */}
                    {metrics.length === 0 && (
                      <Bar dataKey={Object.keys(data[0])[1]} fill={COLORS[0]} radius={[4,4,0,0]} barSize={24} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
              <BarChart3 size={64} className="text-slate-600 mb-4" />
              <p className="text-[13px] text-slate-400 text-center max-w-sm">
                Build your query by dragging columns into the dimensions and metrics areas, then click Run to visualize.
              </p>
            </div>
          )}
        </div>

        {/* AI Insight Section as a separate card */}
        {data.length > 0 && (
          <div className="flex-shrink-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-violet-500/20 p-2 rounded-lg">
                <Info size={20} className="text-violet-400" />
              </div>
              <h3 className="text-[15px] font-bold text-white">AI Data Insight</h3>
            </div>
            <div className="text-[14px] text-slate-300 leading-relaxed">
              {insightLoading ? (
                <div className="flex items-center gap-3 text-slate-400 animate-pulse">
                  <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                  Generating insight...
                </div>
              ) : aiInsight ? (
                <div 
                  className="prose prose-invert prose-sm max-w-none text-slate-300 [&>p]:mb-2 [&>h1]:text-white [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-white [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-white [&>h3]:font-bold [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-2 [&>table]:w-full [&>table]:mb-2 [&>table]:border-collapse [&_th]:border [&_th]:border-white/20 [&_th]:p-2 [&_th]:bg-white/10 [&_td]:border [&_td]:border-white/10 [&_td]:p-2"
                  dangerouslySetInnerHTML={{ __html: marked.parse(aiInsight.replace(/smooth-reason-491707-f6\.(el_nino\.)?/g, "")) as string }} 
                />
              ) : (
                <span className="text-slate-500 italic">No insight available.</span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
