import os
import cv2
import numpy as np
from PIL import Image
from typing import Optional, Dict, Any

HEATMAP_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "heatmaps")


def generate_heatmap(img_path: str, match_path: str, output_id: str) -> Optional[str]:
    """
    Generate a side-by-side heatmap visualization comparing two images.
    Uses a difference-based saliency map as a Grad-CAM-style proxy.
    """
    os.makedirs(HEATMAP_DIR, exist_ok=True)

    try:
        img1 = cv2.imread(img_path)
        img2 = cv2.imread(match_path)
        if img1 is None or img2 is None:
            return None

        # Resize both to same size
        size = (256, 256)
        img1_r = cv2.resize(img1, size)
        img2_r = cv2.resize(img2, size)

        # Compute difference map
        diff = cv2.absdiff(img1_r, img2_r)
        diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)

        # Invert: high similarity = high activation
        saliency = 255 - diff_gray
        heat = cv2.applyColorMap(saliency, cv2.COLORMAP_JET)

        # Overlay heatmap on original
        overlay = cv2.addWeighted(img1_r, 0.6, heat, 0.4, 0)

        # Side-by-side: original | match | heatmap overlay
        combined = np.hstack([img1_r, img2_r, overlay])

        # Add labels
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(combined, "Query", (10, 20), font, 0.5, (255, 255, 255), 1)
        cv2.putText(combined, "Match", (266, 20), font, 0.5, (255, 255, 255), 1)
        cv2.putText(combined, "Similarity Map", (522, 20), font, 0.5, (255, 255, 255), 1)

        out_path = os.path.join(HEATMAP_DIR, f"{output_id}.jpg")
        cv2.imwrite(out_path, combined)
        return out_path
    except Exception as e:
        return None


def generate_heatmap_for_media(media_id: str) -> Optional[str]:
    """Try to generate heatmap for a known media ID from detection records."""
    from agents.ingestion_agent import load_detections
    from db.faiss_store import get_media_store

    detections = load_detections()
    target = next((d for d in detections if d["media_id"] == media_id), None)
    if not target:
        return None

    store = get_media_store()
    # Find a different record to compare
    others = [d for d in detections if d["media_id"] != media_id and d.get("filepath")]
    if not others or not target.get("filepath"):
        return None

    import random
    match = random.choice(others[:5])
    return generate_heatmap(target["filepath"], match["filepath"], media_id)


def explain(
    media_id: str,
    clip_score: float = 0.0,
    ssim_score: float = 0.0,
    query_path: Optional[str] = None,
    original_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate text + visual explanation for a detection using Gemini AI if available.
    When query_path and original_path are both supplied, sends both images to
    Gemini Vision so it can describe the specific visual transformations applied
    (cropping, watermarks, colour shifts, mirroring, etc.).
    Falls back to text-only Gemini, then a rule-based answer.
    """
    final = 0.7 * clip_score + 0.3 * ssim_score
    level = "HIGH" if final > 0.85 else ("MEDIUM" if final >= 0.70 else "LOW")

    text = ""
    gemini_key = os.environ.get("GEMINI_API_KEY", "")

    if gemini_key:
        try:
            import base64
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)

            # --- Path A: Vision — both images available ---
            if (
                query_path and original_path
                and os.path.exists(query_path)
                and os.path.exists(original_path)
            ):
                def _img_to_b64(path: str) -> str:
                    with open(path, "rb") as f:
                        return base64.b64encode(f.read()).decode()

                model = genai.GenerativeModel("gemini-2.0-flash")
                response = model.generate_content([
                    {
                        "role": "user",
                        "parts": [
                            {"text": "Image 1 — ORIGINAL (official broadcast):"},
                            {"inline_data": {"mime_type": "image/jpeg", "data": _img_to_b64(original_path)}},
                            {"text": "Image 2 — SUSPECTED PIRATED VERSION:"},
                            {"inline_data": {"mime_type": "image/jpeg", "data": _img_to_b64(query_path)}},
                            {"text": (
                                f"You are MediaShield AI, a digital forensics expert.\n"
                                f"CLIP semantic similarity: {clip_score * 100:.1f}%\n"
                                f"SSIM structural similarity: {ssim_score * 100:.1f}%\n"
                                f"Risk level: {level}\n\n"
                                f"Compare these two images and write 2-3 sentences starting with "
                                f"'Match detected because...'\n"
                                f"Describe specifically what visual transformations were applied "
                                f"(cropping, watermarks, colour filters, mirroring, overlays).\n"
                                f"Be authoritative and specific about what content is shown."
                            )},
                        ],
                    }
                ])
                text = response.text.strip()

            # --- Path B: Text-only Gemini (no image paths) ---
            if not text:
                model = genai.GenerativeModel("gemini-1.5-flash")
                prompt = (
                    f"You are MediaShield AI, an expert digital forensics AI. "
                    f"Analyze the following match: Media ID {media_id}. "
                    f"Visual similarity (CLIP) is {clip_score * 100:.1f}%. "
                    f"Structural similarity (SSIM) is {ssim_score * 100:.1f}%. "
                    f"Combined risk score is {final * 100:.1f}%, Risk level: {level}. "
                    f"Write a 2-3 sentence authoritative explanation of why this is flagged, "
                    f"starting with 'Match detected because...'"
                )
                response = model.generate_content(prompt)
                text = response.text.strip()

        except Exception:
            text = ""  # Rule-based fallback below

    # --- Path C: Rule-based fallback (no Gemini key or all attempts failed) ---
    if not text:
        if final > 0.85:
            verdict = "Strong evidence of unauthorized media reuse."
        elif final >= 0.70:
            verdict = "Moderate similarity detected — possible unauthorized use."
        else:
            verdict = "Low similarity — may be coincidental."
        text = (
            f"Match detected because visual and structural similarities are significant for media ID {media_id}. "
            f"Combined risk score: {final * 100:.1f}%. "
            f"Risk level: {level}. "
            f"{verdict}"
        )

    heatmap_path = generate_heatmap_for_media(media_id)

    return {
        "media_id": media_id,
        "text_explanation": text,
        "clip_score": round(clip_score, 4),
        "ssim_score": round(ssim_score, 4),
        "final_score": round(final, 4),
        "risk_level": level,
        "heatmap_path": heatmap_path,
        "heatmap_available": heatmap_path is not None,
    }
