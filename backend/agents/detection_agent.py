import numpy as np
import cv2
import os
from typing import List, Dict, Any
from db.faiss_store import get_media_store
from utils.similarity import compute_ssim, combined_score, risk_level, load_image_array
from agents.ingestion_agent import embed_image_pil
from PIL import Image


def detect(query_path: str, top_k: int = 10, threshold: float = 0.55) -> List[Dict[str, Any]]:
    """
    Run detection on a query image.
    Returns list of matches with scores and risk levels.
    """
    from agents.ingestion_agent import embed_media

    # Embed query
    query_embed = embed_media(query_path)
    store = get_media_store(dim=query_embed.shape[0])

    if store.size == 0:
        return []

    # FAISS cosine search
    results = store.search(query_embed, k=min(top_k * 2, store.size))

    matches = []
    query_arr = load_image_array(query_path)

    for clip_score, meta in results:
        if meta.get("filepath") == query_path:
            continue  # skip self

        filepath = meta.get("filepath", "")
        ssim_val = 0.0

        if filepath and os.path.exists(filepath):
            try:
                ref_arr = load_image_array(filepath)
                ssim_val = compute_ssim(query_arr, ref_arr)
            except Exception:
                ssim_val = 0.0

        final = combined_score(max(clip_score, 0), ssim_val)
        level = risk_level(final)

        if final < threshold and level == "LOW":
            continue

        matches.append(
            {
                "match_id": meta["media_id"],
                "clip_score": round(max(clip_score, 0), 4),
                "ssim_score": round(ssim_val, 4),
                "final_score": round(final, 4),
                "risk_level": level,
                "platform": meta.get("platform", "Unknown"),
                "timestamp": meta.get("timestamp", ""),
                "views": meta.get("views", 0),
                "revenue_estimate": meta.get("revenue_estimate", 0),
                "filename": meta.get("filename", ""),
                "filepath": filepath,
            }
        )

    # Sort by final score descending
    matches.sort(key=lambda x: x["final_score"], reverse=True)
    return matches[:top_k]


def detect_from_embed(query_embed: np.ndarray, exclude_id: str = "", top_k: int = 10) -> List[Dict]:
    """Detect using pre-computed embedding."""
    store = get_media_store(dim=query_embed.shape[0])
    if store.size == 0:
        return []

    results = store.search(query_embed, k=min(top_k * 2, store.size))
    matches = []

    for clip_score, meta in results:
        if meta.get("media_id") == exclude_id:
            continue
        final = combined_score(max(clip_score, 0), 0.5)  # no SSIM without paths
        level = risk_level(final)
        matches.append(
            {
                "match_id": meta["media_id"],
                "clip_score": round(max(clip_score, 0), 4),
                "ssim_score": 0.0,
                "final_score": round(final, 4),
                "risk_level": level,
                "platform": meta.get("platform", "Unknown"),
                "timestamp": meta.get("timestamp", ""),
                "views": meta.get("views", 0),
                "revenue_estimate": meta.get("revenue_estimate", 0),
                "filename": meta.get("filename", ""),
            }
        )

    matches.sort(key=lambda x: x["final_score"], reverse=True)
    return matches[:top_k]
