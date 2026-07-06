"use client";
import Link from "next/link";
import { ArrowRight, Activity, ShieldAlert, BarChart2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0014] selection:bg-purple-500/30">
      
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Live El Niño Crisis Monitoring</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-500 tracking-tight mb-6 drop-shadow-sm">
          El Niño Crisis <br className="hidden md:block" /> Intelligence
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          An advanced AI-powered platform for real-time monitoring, predictive analytics, and smart emergency recommendations to combat the El Niño phenomenon in Indonesia.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors text-left">
            <Activity className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-white font-bold mb-2">Real-Time Data</h3>
            <p className="text-sm text-slate-400">Live monitoring of hotspots, drought indexes, and citizen reports.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors text-left">
            <BarChart2 className="w-8 h-8 text-pink-400 mb-4" />
            <h3 className="text-white font-bold mb-2">AI Predictive Analytics</h3>
            <p className="text-sm text-slate-400">Forecasting critical threats before they escalate using BigQuery ML.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors text-left">
            <ShieldAlert className="w-8 h-8 text-red-400 mb-4" />
            <h3 className="text-white font-bold mb-2">Smart Alert Center</h3>
            <p className="text-sm text-slate-400">Actionable recommendations prioritized for emergency response teams.</p>
          </div>
        </div>

        {/* Call to Action */}
        <Link 
          href="/map"
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-red-600 rounded-full font-bold text-white text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)] focus:outline-none focus:ring-4 focus:ring-purple-500/50"
        >
          <span>Start Monitoring</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center w-full z-10">
        <p className="text-xs text-slate-500 font-mono">
          Powered by Next.js, Google BigQuery, and Gemini AI
        </p>
      </div>
    </div>
  );
}
