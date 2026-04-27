from pydantic import BaseModel
from typing import Optional, List, Any
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Platform(str, Enum):
    YOUTUBE = "YouTube"
    TWITTER = "Twitter"
    TIKTOK = "TikTok"
    INSTAGRAM = "Instagram"
    UNKNOWN = "Unknown"


class MediaMetadata(BaseModel):
    media_id: str
    filename: str
    platform: Platform
    timestamp: str
    views: int
    revenue_estimate: float
    is_original: bool


class DetectionMatch(BaseModel):
    original_id: str
    match_id: str
    clip_score: float
    ssim_score: float
    final_score: float
    risk_level: RiskLevel
    platform: Platform
    timestamp: str
    views: int
    revenue_estimate: float


class AnalysisResult(BaseModel):
    media_id: str
    filename: str
    matches: List[DetectionMatch]
    total_matches: int
    highest_risk: RiskLevel
    estimated_loss: float


class GraphNode(BaseModel):
    id: str
    platform: str
    risk_level: str
    views: int
    timestamp: str
    is_original: bool


class GraphEdge(BaseModel):
    source: str
    target: str
    weight: float


class PropagationGraph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    context_snippets: List[str]
    sources: int


class ExplanationResponse(BaseModel):
    media_id: str
    text_explanation: str
    clip_score: Optional[float] = None
    ssim_score: Optional[float] = None
    risk_level: Optional[str] = None
    heatmap_available: bool = False


class StatsResponse(BaseModel):
    total_media: int
    total_detections: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    total_estimated_loss: float
    platforms_affected: List[str]
