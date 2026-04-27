import { Navbar } from "@/components/Navbar";
import { InsightChat } from "@/components/InsightChat";

export default function InsightsPage() {
  return (
    <div className="min-h-screen flex flex-col mesh-bg">
      <Navbar />
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-8 gap-4">
        <div className="panel soft-ring p-5 tilt-card neon-border">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Natural Language Analytics</p>
          <h1 className="text-2xl font-bold text-white mt-1">AI Insights</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ask questions about your detection data — powered by RAG + Gemini 1.5 Flash
          </p>
        </div>
        <div className="flex-1 panel soft-ring overflow-hidden flex flex-col tilt-card" style={{ minHeight: "600px" }}>
          <InsightChat />
        </div>
      </div>
    </div>
  );
}
