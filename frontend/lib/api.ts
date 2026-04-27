const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface DetectionMatch {
  match_id: string;
  clip_score: number;
  ssim_score: number;
  final_score: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  platform: string;
  timestamp: string;
  views: number;
  revenue_estimate: number;
  filename: string;
}

export interface AnalysisResult {
  media_id: string;
  filename: string;
  matches: DetectionMatch[];
  total_matches: number;
  highest_risk: string;
  estimated_loss: number;
  explanation?: {
    text_explanation: string;
    heatmap_available: boolean;
    risk_level: string;
  };
}

export interface GraphData {
  nodes: {
    id: string;
    platform: string;
    risk_level: string;
    views: number;
    timestamp: string;
    is_original: boolean;
    filename: string;
  }[];
  edges: { source: string; target: string; weight: number }[];
}

export interface StatsData {
  total_media: number;
  total_detections: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  total_estimated_loss: number;
  platforms_affected: string[];
}

export async function analyzeMedia(file: File, platform: string): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("platform", platform);
  const res = await fetch(`${BASE}/analyze`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getResults(riskLevel = "", platform = "") {
  const params = new URLSearchParams();
  if (riskLevel) params.set("risk_level", riskLevel);
  if (platform) params.set("platform", platform);
  const res = await fetch(`${BASE}/results?${params}`);
  return res.json();
}

export async function getGraph(): Promise<GraphData> {
  const res = await fetch(`${BASE}/graph`);
  return res.json();
}

export async function queryRAG(question: string) {
  const res = await fetch(`${BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  return res.json();
}

export async function getExplanation(mediaId: string) {
  const res = await fetch(`${BASE}/explain/${mediaId}`);
  return res.json();
}

export async function getStats(): Promise<StatsData> {
  const res = await fetch(`${BASE}/stats`);
  return res.json();
}

export function heatmapUrl(mediaId: string) {
  return `${BASE}/heatmap/${mediaId}`;
}

export function legalReportUrl(mediaId: string) {
  return `${BASE}/legal-report/${mediaId}`;
}
