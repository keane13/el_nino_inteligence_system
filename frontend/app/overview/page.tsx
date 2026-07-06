"use client";
import { Server, Database, Brain, ArrowRight, Layout, Zap, Cloud, Code } from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">El Niño Crisis Intelligence</h1>
        <p className="text-slate-400 text-base max-w-3xl leading-relaxed">
          An integrated platform for comprehensive monitoring, predictive analysis, and smart response dispatching to mitigate the impact of the El Niño climate phenomenon across Indonesia.
        </p>
      </div>

      {/* Features Section */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Layout className="text-purple-400" />
          <h2 className="text-xl font-bold text-white">Core Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Real-Time Map Monitoring", desc: "Interactive visualization of hotspots, drought zones, and live citizen reports.", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { title: "Analytics Dashboard", desc: "Comprehensive data exploration using BigQuery to find hidden insights and patterns.", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
            { title: "Predictive Forecasting", desc: "BigQuery ML ARIMA+ forecasting models predicting threats 1, 3, and 6 months ahead.", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
            { title: "Smart Alert Center", desc: "AI-prioritized actionable tasks with automated dispatch capabilities via Telegram.", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" }
          ].map((f, i) => (
            <div key={i} className={`p-5 rounded-2xl border ${f.border} ${f.bg} backdrop-blur-sm`}>
              <h3 className={`font-bold text-sm mb-2 ${f.color}`}>{f.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="text-yellow-400" />
          <h2 className="text-xl font-bold text-white">System Workflow</h2>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch gap-4">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center">
            <div className="bg-white/10 p-3 rounded-full mb-4">
              <Database className="text-slate-300 w-6 h-6" />
            </div>
            <h3 className="font-bold text-white mb-2 text-sm">1. Data Ingestion</h3>
            <p className="text-xs text-slate-400">Aggregating nationwide data on hotspots, air quality, reservoirs, and public complaints into Google Cloud Storage and BigQuery.</p>
          </div>
          
          <div className="hidden lg:flex items-center justify-center text-slate-600">
            <ArrowRight />
          </div>

          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center">
            <div className="bg-white/10 p-3 rounded-full mb-4">
              <Brain className="text-purple-400 w-6 h-6" />
            </div>
            <h3 className="font-bold text-white mb-2 text-sm">2. AI Processing & ML</h3>
            <p className="text-xs text-slate-400">Gemini AI analyzes unstructured data while BigQuery ML (ARIMA+) generates trend predictions for various threat vectors.</p>
          </div>

          <div className="hidden lg:flex items-center justify-center text-slate-600">
            <ArrowRight />
          </div>

          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center">
            <div className="bg-white/10 p-3 rounded-full mb-4">
              <Server className="text-green-400 w-6 h-6" />
            </div>
            <h3 className="font-bold text-white mb-2 text-sm">3. Actionable Output</h3>
            <p className="text-xs text-slate-400">The frontend dashboard displays real-time triage maps, interactive charts, and sends automated Smart Alerts to responders.</p>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Code className="text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Technology Stack</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { tech: "Next.js 14", category: "Frontend Framework" },
            { tech: "Tailwind CSS", category: "Styling" },
            { tech: "Google BigQuery", category: "Data Warehouse & ML" },
            { tech: "Google Cloud Storage", category: "Object Storage" },
            { tech: "Gemini 1.5 Pro", category: "LLM Intelligence" },
            { tech: "FastAPI", category: "Backend Python API" },
            { tech: "LangChain & LangSmith", category: "LLM Orchestration & Tracing" },
            { tech: "Cloud Run & Docker", category: "Deployment" }
          ].map((t, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <h3 className="font-bold text-white text-sm mb-1">{t.tech}</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.category}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
