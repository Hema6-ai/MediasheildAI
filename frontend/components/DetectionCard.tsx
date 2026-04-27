"use client";
import { useState } from "react";
import { RiskBadge } from "./RiskBadge";
import { DetectionMatch } from "@/lib/api";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";

interface Props {
  match: DetectionMatch;
  mediaId: string;
  backendUrl: string;
}

export function DetectionCard({ match, mediaId, backendUrl }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [heatmapError, setHeatmapError] = useState(false);

  return (
    <div className="panel soft-ring p-4 hover:border-white/25 transition-all tilt-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <RiskBadge level={match.risk_level} />
            <span className="text-xs text-slate-500">{match.platform}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500 font-mono">{match.match_id}</span>
          </div>
          <p className="text-sm text-slate-300 truncate">{match.filename || "Unknown file"}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(match.timestamp).toLocaleString()} · {match.views.toLocaleString()} views
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-black" style={{
            color: match.final_score > 0.85 ? "#f87171" : match.final_score >= 0.70 ? "#facc15" : "#4ade80"
          }}>
            {(match.final_score * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">match</div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ScoreBar label="CLIP" value={match.clip_score} color="#06b6d4" />
        <ScoreBar label="SSIM" value={match.ssim_score} color="#9333ea" />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Est. loss: <span className="text-red-400 font-semibold">${match.revenue_estimate.toFixed(2)}</span>
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Eye className="w-3 h-3" />
          {expanded ? "Hide" : "Details"}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
          <p className="text-xs text-slate-400">
            Combined Score: <strong>0.7 × CLIP + 0.3 × SSIM</strong> ={" "}
            <span className="text-cyan-400 font-mono">{match.final_score.toFixed(4)}</span>
          </p>
          {!heatmapError && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Similarity Heatmap</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${backendUrl}/heatmap/${mediaId}`}
                alt="Heatmap"
                className="rounded-lg w-full object-cover max-h-40"
                onError={() => setHeatmapError(true)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span style={{ color }} className="font-mono">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
