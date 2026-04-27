"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { RiskBadge } from "@/components/RiskBadge";
import { getResults, getExplanation, heatmapUrl, legalReportUrl } from "@/lib/api";
import { Filter, RefreshCw, Eye, Download } from "lucide-react";

const PLATFORMS = ["", "YouTube", "Twitter", "TikTok", "Instagram", "Unknown"];
const RISKS = ["", "HIGH", "MEDIUM", "LOW"];

export default function DetectionPage() {
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [explanation, setExplanation] = useState<any | null>(null);
  const [imgError, setImgError] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getResults(riskFilter, platformFilter);
      setResults(data.results || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [riskFilter, platformFilter]);

  const handleSelect = async (r: any) => {
    setSelected(r);
    setImgError(false);
    setExplanation(null);
    try {
      const exp = await getExplanation(r.media_id);
      setExplanation(exp);
    } catch {}
  };

  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="panel soft-ring p-5 mb-6 flex items-center justify-between flex-wrap gap-3 tilt-card neon-border">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Audit Trail</p>
            <h1 className="text-2xl font-bold text-white mt-1">All Detections</h1>
            <p className="text-slate-400 text-sm mt-1">{total} records in database</p>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              {RISKS.map((r) => <option key={r} value={r} className="bg-gray-900">{r || "All Risks"}</option>)}
            </select>
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              {PLATFORMS.map((p) => <option key={p} value={p} className="bg-gray-900">{p || "All Platforms"}</option>)}
            </select>
            <button onClick={load} className="p-2 rounded-lg glass border border-white/10 text-slate-400 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2 panel soft-ring overflow-hidden tilt-card">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="text-left px-4 py-3">ID</th>
                      <th className="text-left px-4 py-3">Platform</th>
                      <th className="text-left px-4 py-3">Score</th>
                      <th className="text-left px-4 py-3">Risk</th>
                      <th className="text-left px-4 py-3">Views</th>
                      <th className="text-left px-4 py-3">Time</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.media_id}
                        className={`border-b border-white/3 hover:bg-white/3 transition-colors cursor-pointer ${selected?.media_id === r.media_id ? "bg-cyan-500/5" : ""}`}
                        onClick={() => handleSelect(r)}>
                        <td className="px-4 py-3 font-mono text-cyan-400 text-xs">{r.media_id}</td>
                        <td className="px-4 py-3 text-slate-300">{r.platform}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {r.final_score ? (r.final_score * 100).toFixed(0) + "%" : "—"}
                        </td>
                        <td className="px-4 py-3"><RiskBadge level={r.risk_level || "LOW"} /></td>
                        <td className="px-4 py-3 text-slate-400">{r.views?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(r.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Eye className="w-4 h-4 text-slate-600 hover:text-cyan-400 transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-sm">No results found</div>
                )}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="panel soft-ring p-5 tilt-card">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white text-sm">Media Detail</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">{selected.media_id}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <Row label="Filename" value={selected.filename} />
                  <Row label="Platform" value={selected.platform} />
                  <Row label="Risk" value={<RiskBadge level={selected.risk_level || "LOW"} />} />
                  <Row label="Views" value={selected.views?.toLocaleString()} />
                  <Row label="Revenue" value={`$${selected.revenue_estimate?.toFixed(2)}`} />
                  <Row label="Original" value={selected.is_original ? "Yes" : "No"} />
                </div>

                {explanation && (
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">{explanation.text_explanation}</p>
                    {!imgError && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Similarity Heatmap</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={heatmapUrl(selected.media_id)}
                          alt="heatmap"
                          className="rounded-lg w-full"
                          onError={() => setImgError(true)}
                        />
                      </div>
                    )}
                    
                    <a href={legalReportUrl(selected.media_id)} target="_blank" rel="noreferrer"
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-sm font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition-all glow-cyan cursor-pointer">
                      <Download className="w-4 h-4" />
                      Download Legal Evidence PDF
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
                Click a row to see details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-slate-500 text-xs shrink-0">{label}</span>
      <span className="text-slate-300 text-xs text-right">{value}</span>
    </div>
  );
}
