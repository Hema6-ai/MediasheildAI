import os
import shutil
import uuid
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="MediaShield AI",
    description="AI-powered multi-agent system for detecting unauthorized digital sports media.",
    version="1.0.0",
)

cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), "data", "media"), exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), "data", "heatmaps"), exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), "data", "indices"), exist_ok=True)
DETECTIONS_FILE = os.path.join(os.path.dirname(__file__), "data", "detections.json")
BOOTSTRAP_FAIL_MARKER = os.path.join(os.path.dirname(__file__), "data", ".bootstrap_failed")


class QueryRequest(BaseModel):
    question: str


def _should_bootstrap_dataset() -> bool:
    mode = os.environ.get("AUTO_BOOTSTRAP_DATASET", "true").strip().lower()
    if mode in {"0", "false", "no"}:
        return False
    if os.path.exists(BOOTSTRAP_FAIL_MARKER) and mode != "force":
        return False
    if not os.path.exists(DETECTIONS_FILE):
        return True
    from db.faiss_store import get_media_store, get_rag_store
    return get_media_store().size == 0 or get_rag_store().size == 0


@app.on_event("startup")
def bootstrap_dataset_on_startup():
    """
    Auto-generate baseline synthetic data when metadata/indexes are missing.
    Disable by setting AUTO_BOOTSTRAP_DATASET=false.
    """
    if not _should_bootstrap_dataset():
        return
    try:
        from data.generate_dataset import generate
        generate()
        if os.path.exists(BOOTSTRAP_FAIL_MARKER):
            os.remove(BOOTSTRAP_FAIL_MARKER)
    except Exception as exc:
        # Never block server startup on bootstrap failures (e.g. no model download access).
        with open(BOOTSTRAP_FAIL_MARKER, "w", encoding="utf-8") as marker:
            marker.write(str(exc))
        print(f"Dataset bootstrap skipped due to error: {exc}")


@app.get("/health")
def health():
    from db.faiss_store import get_media_store, get_rag_store
    media_store = get_media_store()
    rag_store = get_rag_store()
    return {
        "status": "ok",
        "media_indexed": media_store.size,
        "rag_indexed": rag_store.size,
        "gemini_enabled": bool(os.environ.get("GEMINI_API_KEY")),
    }


@app.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    platform: str = Form(default="Unknown"),
):
    """Ingest a media file and return its media_id."""
    ext = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
    tmp_name = f"{uuid.uuid4().hex}{ext}"
    tmp_path = os.path.join(UPLOAD_DIR, tmp_name)

    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    from agents.ingestion_agent import ingest_file
    meta = ingest_file(tmp_path, file.filename or tmp_name, platform)
    return {"media_id": meta["media_id"], "filename": meta["filename"], "platform": platform}


@app.post("/analyze")
async def analyze_media(
    file: UploadFile = File(...),
    platform: str = Form(default="Unknown"),
):
    """Full pipeline: upload → detect → explain → index."""
    ext = os.path.splitext(file.filename or "upload.jpg")[1] or ".jpg"
    tmp_name = f"{uuid.uuid4().hex}{ext}"
    tmp_path = os.path.join(UPLOAD_DIR, tmp_name)

    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    from agents.orchestrator import run_full_pipeline
    result = run_full_pipeline(tmp_path, file.filename or tmp_name, platform)
    return result


@app.get("/results")
def get_results(risk_level: str = "", platform: str = "", limit: int = 50):
    """List all detections, optionally filtered."""
    from agents.ingestion_agent import load_detections
    data = load_detections()

    if risk_level:
        data = [d for d in data if d.get("risk_level", "").upper() == risk_level.upper()]
    if platform:
        data = [d for d in data if d.get("platform", "").lower() == platform.lower()]

    data.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return {"results": data[:limit], "total": len(data)}


@app.get("/graph")
def get_graph():
    """Return propagation graph JSON for D3.js."""
    from agents.propagation_agent import load_cached_graph
    return load_cached_graph()


@app.post("/query")
async def rag_query(body: QueryRequest):
    """RAG query: question → retrieve context → Gemini answer."""
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="question is required")
    from agents.rag_agent import answer
    return answer(question)


@app.get("/explain/{media_id}")
def explain_media(media_id: str):
    """Get text + heatmap explanation for a detection."""
    from agents.ingestion_agent import load_detections
    from agents.explainability_agent import explain

    detections = load_detections()
    record = next((d for d in detections if d["media_id"] == media_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Media not found")

    clip = record.get("final_score", 0.75)
    ssim = record.get("final_score", 0.75) * 0.9
    return explain(media_id, clip_score=clip, ssim_score=ssim)


@app.get("/heatmap/{media_id}")
def get_heatmap(media_id: str):
    """Return heatmap image file for a media ID."""
    heatmap_dir = os.path.join(os.path.dirname(__file__), "data", "heatmaps")
    path = os.path.join(heatmap_dir, f"{media_id}.jpg")

    if not os.path.exists(path):
        from agents.explainability_agent import generate_heatmap_for_media
        generated = generate_heatmap_for_media(media_id)
        if not generated:
            raise HTTPException(status_code=404, detail="Heatmap not available")
        path = generated

    return FileResponse(path, media_type="image/jpeg")


@app.get("/legal-report/{media_id}")
def get_legal_report(media_id: str):
    """Generate and return a PDF legal evidence report."""
    from agents.ingestion_agent import load_detections
    from agents.explainability_agent import explain
    from agents.legal_agent import generate_legal_report
    import os

    detections = load_detections()
    record = next((d for d in detections if d["media_id"] == media_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Media not found")

    # Generate explanation and heatmap first
    clip = record.get("final_score", 0.75)
    ssim = record.get("final_score", 0.75) * 0.9
    explain_data = explain(media_id, clip_score=clip, ssim_score=ssim)
    
    # Merge explanation into record
    record["text_explanation"] = explain_data.get("text_explanation", "")
    
    heatmap_path = explain_data.get("heatmap_path")
    pdf_path = generate_legal_report(media_id, record, heatmap_path)
    
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")
        
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"Legal_Evidence_{media_id}.pdf")



@app.get("/stats")
def get_stats():
    """Summary statistics."""
    from agents.ingestion_agent import load_detections
    data = load_detections()

    risk_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    platforms = set()
    total_loss = 0.0
    total_detections = 0

    for d in data:
        r = d.get("risk_level", "LOW").upper()
        risk_counts[r] = risk_counts.get(r, 0) + 1
        platforms.add(d.get("platform", "Unknown"))
        if not d.get("is_original"):
            total_loss += d.get("revenue_estimate", 0)
            total_detections += 1

    return {
        "total_media": len(data),
        "total_detections": total_detections,
        "high_risk_count": risk_counts.get("HIGH", 0),
        "medium_risk_count": risk_counts.get("MEDIUM", 0),
        "low_risk_count": risk_counts.get("LOW", 0),
        "total_estimated_loss": round(total_loss, 2),
        "platforms_affected": list(platforms),
    }
