"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MediaUpload } from "@/components/MediaUpload";
import { DetectionCard } from "@/components/DetectionCard";
import { RiskBadge } from "@/components/RiskBadge";
import { analyzeMedia, getStats, AnalysisResult, StatsData } from "@/lib/api";
import { AlertTriangle, CheckCircle, TrendingDown, Database } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, []);

  const handleAnalyze = async (file: File, platform: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await analyzeMedia(file, platform);
      setResult(res);
      getStats().then(setStats).catch(() => {});
    } catch (e: any) {
      setError(e.message || "Analysis failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="panel soft-ring p-5 tilt-card neon-border">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Control Center</p>
          <h1 className="text-3xl font-black text-white mt-1">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-2">Upload media to detect unauthorized usage across platforms</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Database className="w-4 h-4 text-cyan-400" />} label="Total Media" value={stats.total_media} />
            <StatCard icon={<AlertTriangle className="w-4 h-4 text-red-400" />} label="High Risk" value={stats.high_risk_count} accent="red" />
            <StatCard icon={<TrendingDown className="w-4 h-4 text-yellow-400" />} label="Est. Loss" value={`$${stats.total_estimated_loss.toFixed(0)}`} accent="yellow" />
            <StatCard icon={<CheckCircle className="w-4 h-4 text-green-400" />} label="Platforms" value={stats.platforms_affected.length} accent="green" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Upload */}
          <div className="lg:col-span-2">
            <MediaUpload onAnalyze={handleAnalyze} loading={loading} />
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {error && (
              <div className="glass border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Summary */}
              <div className="panel soft-ring p-4 tilt-card">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{result.filename}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {result.total_matches} matches found
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <RiskBadge level={result.highest_risk} />
                      <span className="text-sm text-red-400 font-semibold">
                        Est. loss: ${result.estimated_loss.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {result.explanation && (
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed border-t border-white/5 pt-3">
                      {result.explanation.text_explanation}
                    </p>
                  )}
                </div>

                {/* Match cards */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {result.matches.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      No significant matches found. Media appears original.
                    </div>
                  ) : (
                    result.matches.map((m) => (
                      <DetectionCard key={m.match_id} match={m} mediaId={result.media_id} backendUrl={BASE} />
                    ))
                  )}
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="panel soft-ring p-12 text-center text-slate-500 tilt-card">
                <Database className="w-12 h-12 mx-auto mb-4 text-slate-700" />
                <p className="text-sm">Upload a media file to start detection</p>
                <p className="text-xs mt-1 text-slate-600">Supports images and video files</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent = "cyan" }: any) {
  const colors: Record<string, string> = {
    cyan: "text-cyan-400", red: "text-red-400", yellow: "text-yellow-400", green: "text-green-400"
  };
  return (
    <div className="panel soft-ring p-4 tilt-card">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <div className={`text-2xl font-black ${colors[accent] || colors.cyan}`}>{value}</div>
    </div>
  );
}
