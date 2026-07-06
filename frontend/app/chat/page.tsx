import ChatPanel from "@/components/ChatPanel";
import { getComplaints, computeSummary } from "@/lib/data";

export default function ChatPage() {
  const complaints = getComplaints();
  const summary = computeSummary(complaints);

  return (
    <div className="h-full flex flex-col px-8 py-6 overflow-hidden">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Chat Assistant</h1>
        <p className="text-slate-400 text-sm mt-1">Natural Query Language analysis and interactive chat.</p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg flex-1 min-h-0 overflow-hidden mx-4">
        <ChatPanel summary={summary} />
      </div>
    </div>
  );
}
