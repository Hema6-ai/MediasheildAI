import os
from typing import Dict, Any, List
from agents.ingestion_agent import ingest_file, update_detection
from agents.detection_agent import detect
from agents.propagation_agent import build_propagation_graph
from agents.rag_agent import answer, index_detection
from agents.explainability_agent import explain


def run_full_pipeline(filepath: str, filename: str, platform: str = "Unknown") -> Dict[str, Any]:
    """
    Full pipeline: ingest → detect → explain → index for RAG → update graph.
    Returns combined result.
    """
    # Step 1: Ingest
    meta = ingest_file(filepath, filename, platform)
    media_id = meta["media_id"]

    # Step 2: Detect
    matches = detect(filepath, top_k=10, threshold=0.50)

    # Step 3: Determine highest risk
    risk_order = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
    highest_risk = "LOW"
    total_loss = 0.0

    for m in matches:
        if risk_order.get(m["risk_level"], 0) > risk_order.get(highest_risk, 0):
            highest_risk = m["risk_level"]
        total_loss += m.get("revenue_estimate", 0)

    # Write risk_level and final_score back to detections.json
    update_detection(media_id, {
        "risk_level": highest_risk,
        "final_score": matches[0]["final_score"] if matches else 0.0,
        "revenue_estimate": round(total_loss, 2),
    })
    # Step 4: Explain top match if available
    explanation = None
    if matches:
        top = matches[0]
        explanation = explain(
            media_id=media_id,
            clip_score=top["clip_score"],
            ssim_score=top["ssim_score"],
            query_path=filepath,
            original_path=top.get("filepath"),
        )

    # Step 5: Index this detection in RAG
    detection_record = {
        **meta,
        "risk_level": highest_risk,
        "final_score": matches[0]["final_score"] if matches else 0.0,
    }
    index_detection(detection_record)

    # Step 6: Rebuild propagation graph
    try:
        build_propagation_graph()
    except Exception:
        pass

    return {
        "media_id": media_id,
        "filename": filename,
        "matches": matches,
        "total_matches": len(matches),
        "highest_risk": highest_risk,
        "estimated_loss": round(total_loss, 2),
        "explanation": explanation,
    }
