"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { getGraph, GraphData } from "@/lib/api";
import { RefreshCw } from "lucide-react";

// D3 must be client-side only
const PropagationGraph = dynamic(
  () => import("@/components/PropagationGraph").then((m) => m.PropagationGraph),
  { ssr: false }
);

export default function GraphPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const g = await getGraph();
      setData(g);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const riskCounts = data ? {
    HIGH: data.nodes.filter((n) => n.risk_level === "HIGH").length,
    MEDIUM: data.nodes.filter((n) => n.risk_level === "MEDIUM").length,
    LOW: data.nodes.filter((n) => n.risk_level === "LOW").length,
    originals: data.nodes.filter((n) => n.is_original).length,
  } : null;

  return (
    <div className="min-h-screen flex flex-col mesh-bg">
      <Navbar />
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8 gap-4">
        <div className="panel soft-ring p-5 flex items-center justify-between flex-wrap gap-3 tilt-card neon-border">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Spread Intelligence</p>
            <h1 className="text-2xl font-bold text-white mt-1">Propagation Graph</h1>
            <p className="text-slate-400 text-sm mt-1">
              How unauthorized media spreads across platforms — drag nodes, scroll to zoom
            </p>
          </div>
          <button onClick={load} className="p-2 rounded-lg glass border border-white/10 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Legend + stats */}
        {riskCounts && (
          <div className="flex flex-wrap gap-4 text-sm">
            <LegendItem color="#4ade80" label={`Original (${riskCounts.originals})`} big />
            <LegendItem color="#f87171" label={`HIGH Risk (${riskCounts.HIGH})`} />
            <LegendItem color="#facc15" label={`MEDIUM Risk (${riskCounts.MEDIUM})`} />
            <LegendItem color="#4ade80" label={`LOW Risk (${riskCounts.LOW})`} />
            <span className="text-slate-500 text-xs ml-auto self-center">
              {data?.nodes.length} nodes · {data?.edges.length} connections
            </span>
          </div>
        )}

        {/* Graph canvas */}
        <div className="flex-1 panel soft-ring overflow-hidden tilt-card" style={{ minHeight: "520px" }}>
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Building graph...
            </div>
          ) : data && data.nodes.length > 0 ? (
            <PropagationGraph data={data} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              No graph data available. Run the dataset generator first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, big }: { color: string; label: string; big?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-full border-2 border-gray-900"
        style={{ backgroundColor: color, width: big ? 18 : 12, height: big ? 18 : 12 }} />
      <span className="text-slate-400 text-xs">{label}</span>
    </div>
  );
}
