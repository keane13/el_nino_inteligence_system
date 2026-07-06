"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, BarChart3, TrendingUp, Lightbulb, MessageSquare, Cpu, Flame, Info } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(true);

  const menu = [
    { name: "Overview", path: "/overview", icon: Info },
    { name: "Map Monitoring", path: "/map", icon: LayoutDashboard },
    { 
      name: "Analytics", 
      icon: BarChart3,
      submenus: [
        { name: "Elnino War Room", path: "/warroom", icon: Flame, alert: true },
        { name: "Complaints", path: "/analytics/complaints", icon: BarChart3 },
        { name: "Data Explorer", path: "/analytics/explorer", icon: LayoutDashboard }
      ]
    },
    { name: "Predictions", path: "/predictions", icon: TrendingUp },
    { name: "Alert Center", path: "/recommendations", icon: Lightbulb },
    { name: "AI Chatbot", path: "/chat", icon: MessageSquare },
  ];

  return (
    <aside className="w-[240px] shrink-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full z-50 transition-all">
      {/* Header / Brand */}
      <div className="h-[60px] flex items-center gap-3 px-5 border-b border-[var(--border)] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-red-500 to-violet-600 flex items-center justify-center text-[15px] shrink-0 text-white shadow-[0_0_18px_rgba(239,68,68,0.5)]">
          🌡️
        </div>
        <div>
          <div className="text-[14px] font-bold tracking-tight text-white leading-tight">
            El Nino Crisis <span className="text-orange-400">Inteligence</span>
          </div>
          <div className="text-[9px] text-orange-300/70 font-mono leading-tight"> Crisis Intelligence</div>
        </div>
      </div>

      {/* El Niño Alert Banner */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
        <div>
          <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider">El Niño Aktif</div>
          <div className="text-[9px] text-red-300/70">ONI +1.6 — Kuat</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 scrollbar-thin">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-3">
          Main Menu
        </div>

        {menu.map((item) => {
          if (item.submenus) {
            const isAnySubActive = item.submenus.some(sub => pathname === sub.path);
            const Icon = item.icon;
            return (
              <div key={item.name} className="flex flex-col gap-1">
                <button
                  onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all relative w-full text-left ${
                    isAnySubActive
                      ? "bg-violet-500/10 text-violet-400 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={16} className={isAnySubActive ? "text-violet-400" : "text-slate-500"} />
                  {item.name}
                  <div className="ml-auto flex items-center gap-2">
                    {item.submenus.some(s => s.alert) && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    <span className="text-[10px] opacity-50">{isAnalyticsOpen ? "▼" : "▶"}</span>
                  </div>
                </button>

                {isAnalyticsOpen && (
                  <div className="flex flex-col gap-1 pl-4 mt-1 border-l border-white/5 ml-3">
                    {item.submenus.map(sub => {
                      const isActive = pathname === sub.path;
                      const SubIcon = sub.icon;
                      const isWarRoom = sub.path === "/warroom";
                      return (
                        <Link
                          key={sub.path}
                          href={sub.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-medium transition-all relative ${
                            isActive
                              ? isWarRoom
                                ? "bg-orange-500/10 text-orange-400 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.3)]"
                                : "bg-violet-500/10 text-violet-400 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <SubIcon size={14} className={isActive ? (isWarRoom ? "text-orange-400" : "text-violet-400") : "text-slate-500"} />
                          {sub.name}
                          {sub.alert && !isActive && (
                            <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all relative ${
                isActive
                  ? "bg-violet-500/10 text-violet-400 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={16} className={isActive ? "text-violet-400" : "text-slate-500"} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[var(--border)] shrink-0 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-[11px] font-medium text-emerald-400">System Online</div>
        </div>
        <div className="text-[9px] text-slate-500 text-center font-mono">Powered by Gemini AI + BigQuery</div>
      </div>
    </aside>
  );
}
