"use client";
import { useState, useRef, useEffect, ReactNode } from "react";
import { Summary } from "@/lib/data";
import { marked } from 'marked';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface Message { role: "user" | "assistant"; content: string; image?: string }

interface Props { summary: Summary | null }

const QUICK = [
  "Which province has the worst drought?",
  "How many active fire hotspots this week?",
  "Which reservoir is near critical level?",
  "Jakarta AQI prediction for next 7 days",
  "What emergency El Niño recommendations are needed?",
  "Which province has the most active fire hotspots?",
];

export default function ChatPanel({ summary }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I am **El Niño** crisis assistant 🤖\n\n I am ready to analyze:\n• 🏜️ Drought severity & index per province\n• 🔥 Active wildfire hotspots\n• 🌫️ Air quality\n• 💧 Reservoir levels & water crises\n• 📊 El Nino Summaries, insights and \n• 🗺️ Citizen complaints, \n\nAsk me anything in English or Indonesian, I'll answer + show charts automatically!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Analyzing request...");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setLoadingText("Analyzing request...");
      return;
    }
    const tags = [
      "Analyzing request...",
      "Searching information...",
      "Calling tools...",
      "Preparing data...",
      "Generating response..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % tags.length;
      setLoadingText(tags[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  const send = async (msg: string) => {
    if ((!msg.trim() && !image) || loading) return;
    const userMsg: Message = { role: "user", content: msg, image: image || undefined };
    setMessages(prev => [...prev, userMsg]);
    const currentImage = image;
    setInput("");
    setImage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: messages.slice(-8), image: currentImage }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Terjadi kesalahan koneksi. Silakan coba lagi." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatContent = (text: string) => {
    const cleanedText = text.replace(/smooth-reason-491707-f6\.(el_nino\.)?/g, "");
    return marked.parse(cleanedText) as string;
  };

  const renderMessageContent = (content: string) => {
    // Regex to match our custom JSON blocks (chart or looker or just json)
    const blockRegex = /```(?:chart|looker|json)?\s*({[\s\S]*?})\s*```/g;
    
    let lastIndex = 0;
    const elements: ReactNode[] = [];
    const allMatches = [];
    
    let match;
    while ((match = blockRegex.exec(content)) !== null) {
      allMatches.push({ index: match.index, length: match[0].length, json: match[1], fullMatch: match[0] });
    }
    
    allMatches.forEach((m, idx) => {
      // Add text before the match
      if (m.index > lastIndex) {
        const textPart = content.substring(lastIndex, m.index);
        elements.push(<div key={`text-${idx}`} className="markdown-content" dangerouslySetInnerHTML={{ __html: formatContent(textPart) }} />);
      }
      
      // Add the component
      try {
        const data = JSON.parse(m.json);
        if (data.type === 'bar' || data.type === 'line' || data.type === 'pie') {
          elements.push(
            <div key={`chart-${idx}`} className="w-full h-[250px] mt-2 mb-2 bg-[#0f172a] rounded-lg p-2 border border-white/10 shadow-sm">
              {data.title && <div className="text-center text-[11px] text-slate-400 font-bold mb-2">{data.title}</div>}
              <ResponsiveContainer width="100%" height="100%">
                {data.type === 'bar' ? (
                  <BarChart data={data.data}>
                    <XAxis dataKey={data.xAxis} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} width={30} />
                    <RechartsTooltip contentStyle={{backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#f8fafc'}} />
                    <Bar dataKey={data.yAxis} fill="#8b5cf6" radius={[4,4,0,0]} />
                  </BarChart>
                ) : data.type === 'line' ? (
                  <LineChart data={data.data}>
                    <XAxis dataKey={data.xAxis} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} width={30} />
                    <RechartsTooltip contentStyle={{backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#f8fafc'}} />
                    <Line type="monotone" dataKey={data.yAxis} stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6'}} />
                  </LineChart>
                ) : (
                  <PieChart>
                    <Pie data={data.data} dataKey={data.yAxis} nameKey={data.xAxis} cx="50%" cy="50%" outerRadius={80} label={({name, percent = 0}: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {data.data.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#8b5cf6', '#d946ef', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'][index % 6]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#f8fafc'}} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          );
        } else if (data.url) {
          elements.push(
            <div key={`looker-${idx}`} className="w-full mt-2 mb-2 bg-[#0f172a] rounded-lg border border-white/10 overflow-hidden shadow-sm">
              {data.title && <div className="text-center text-[10px] text-slate-400 font-bold py-1 bg-[#020617] border-b border-white/10">{data.title}</div>}
              <iframe src={data.url} width="100%" height="250" style={{ border: 0 }} allowFullScreen />
            </div>
          );
        } else {
          // If it's just random JSON, render it as text
          elements.push(<div key={`text-json-${idx}`} className="markdown-content" dangerouslySetInnerHTML={{ __html: formatContent(m.fullMatch || "") }} />);
        }
      } catch (e) {
        elements.push(<div key={`err-${idx}`} className="text-red-400 text-[10px]">[Error parsing visual component]</div>);
      }
      
      lastIndex = m.index + m.length;
    });
    
    // Add remaining text
    if (lastIndex < content.length) {
      const textPart = content.substring(lastIndex);
      elements.push(<div key={`text-end`} className="markdown-content" dangerouslySetInnerHTML={{ __html: formatContent(textPart) }} />);
    }
    
    // If no matches, just render the text
    if (allMatches.length === 0) {
      return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: formatContent(content) }} />;
    }
    
    return <div className="flex flex-col gap-1">{elements}</div>;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Context strip */}
      {summary && (
        <div className="flex gap-4 px-6 py-2 border-b border-white/10 bg-[#0f172a]/50 backdrop-blur-md">
          {[
            { label: "Total", val: summary.total_complaints, color: "#00d4ff" },
            { label: "Open", val: summary.open_complaints, color: "#ef4444" },
            { label: "Escalated", val: summary.escalated_complaints, color: "#f59e0b" },
            { label: "Resolved %", val: `${summary.resolution_rate}%`, color: "#10b981" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[13px] font-bold font-mono" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[9px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick prompts */}
      <div className="px-6 pt-2.5 pb-1.5 flex flex-wrap gap-1.5 border-b border-[var(--border)] bg-transparent shadow-sm backdrop-blur-sm">
        {QUICK.map(q => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading}
            className="text-[10px] bg-white/5 border border-white/10 text-slate-400 hover:border-violet-500 hover:text-white hover:bg-white/10 px-2 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {q.length > 36 ? q.slice(0, 36) + "…" : q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"} mb-2`}>
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] shrink-0 mt-0.5 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                ✨
              </div>
            )}
            <div
              className={`text-[13.5px] leading-relaxed w-fit max-w-[85%] sm:max-w-[600px] overflow-hidden ${
                m.role === "assistant"
                  ? "text-slate-200 bg-transparent py-1 px-1"
                  : "bg-[#1e293b] rounded-[24px] px-5 py-3 text-slate-100 shadow-sm"
              }`}
            >
              {m.image && (
                <img src={m.image} alt="Uploaded" className="w-48 rounded-xl mb-3 border border-white/10 shadow-md" />
              )}
              {renderMessageContent(m.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 flex-row mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] shrink-0 mt-0.5 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]">
              ✨
            </div>
            <div className="flex flex-col gap-1 py-1">
              <div className="flex gap-1.5 items-center px-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <div className="text-[10px] text-violet-300/80 font-mono italic px-1 animate-pulse">
                {loadingText}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-2 flex justify-center bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent w-full">
        <div className="w-full max-w-3xl flex flex-col bg-[#1e293b] rounded-[28px] p-2 relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          {image && (
            <div className="relative mb-1 ml-3 mt-2 w-16 h-16 rounded-xl overflow-hidden border border-white/10 group">
              <img src={image} className="w-full h-full object-cover" />
              <button 
                onClick={() => setImage(null)} 
                className="absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex items-end gap-1 px-1">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 text-[20px] transition-colors shrink-0 mb-0.5"
              title="Upload image"
            >
              +
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
              }}
              onKeyDown={e => { 
                if (e.key === "Enter" && !e.shiftKey) { 
                  e.preventDefault(); 
                  send(input); 
                  e.currentTarget.style.height = 'auto'; 
                }
              }}
              placeholder="Tanya Jakarta Pulse AI..."
              rows={1}
              className="flex-1 bg-transparent py-3 px-2 text-[14.5px] text-slate-100 placeholder-slate-400 outline-none resize-none max-h-[150px] font-sans scrollbar-thin self-center leading-relaxed"
            />
            <button
              onClick={() => {
                send(input);
                if (textareaRef.current) textareaRef.current.style.height = 'auto';
              }}
              disabled={loading || (!input.trim() && !image)}
              className="w-10 h-10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-full flex items-center justify-center text-slate-400 disabled:text-slate-500 text-[18px] transition-colors shrink-0 mb-0.5"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
