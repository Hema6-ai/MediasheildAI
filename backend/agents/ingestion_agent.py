import os
import uuid
import json
import numpy as np
from PIL import Image
from typing import Optional, List
import open_clip
import torch
import cv2

MEDIA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "media")
META_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "detections.json")

_model = None
_preprocess = None
_tokenizer = None
_device = "cpu"


def _load_clip():
    global _model, _preprocess, _tokenizer, _device
    if _model is None:
        _device = "cuda" if torch.cuda.is_available() else "cpu"
        _model, _, _preprocess = open_clip.create_model_and_transforms(
            "ViT-B-32", pretrained="openai"
        )
        _model = _model.to(_device)
        _model.eval()
    return _model, _preprocess


def embed_image(image_path: str) -> np.ndarray:
    """Return CLIP embedding for an image file."""
    model, preprocess = _load_clip()
    img = Image.open(image_path).convert("RGB")
    tensor = preprocess(img).unsqueeze(0).to(_device)
    with torch.no_grad():
        features = model.encode_image(tensor)
    return features.squeeze().cpu().numpy()


def embed_image_pil(pil_image: Image.Image) -> np.ndarray:
    """Return CLIP embedding for a PIL image."""
    model, preprocess = _load_clip()
    tensor = preprocess(pil_image).unsqueeze(0).to(_device)
    with torch.no_grad():
        features = model.encode_image(tensor)
    return features.squeeze().cpu().numpy()


def _is_video(path: str) -> bool:
    ext = os.path.splitext(path.lower())[1]
    return ext in {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}


def embed_video(video_path: str, frame_interval_sec: float = 1.0) -> np.ndarray:
    """
    Return CLIP embedding for a video by sampling frames and average pooling.
    Falls back to first frame if FPS metadata is missing.
    """
    model, preprocess = _load_clip()
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Unable to open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps <= 0:
        fps = 1.0
    frame_stride = max(1, int(round(fps * frame_interval_sec)))

    frame_idx = 0
    batch_tensors: List[torch.Tensor] = []

    while True:
        success, frame = cap.read()
        if not success:
            break
        if frame_idx % frame_stride == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_frame = Image.fromarray(rgb)
            batch_tensors.append(preprocess(pil_frame))
        frame_idx += 1

    cap.release()

    if not batch_tensors:
        raise ValueError(f"No frames sampled from video: {video_path}")

    tensors = torch.stack(batch_tensors).to(_device)
    with torch.no_grad():
        feats = model.encode_image(tensors)
    pooled = feats.mean(dim=0)
    return pooled.cpu().numpy()


def embed_media(path: str) -> np.ndarray:
    """Return CLIP embedding for either image or video input."""
    if _is_video(path):
        return embed_video(path)
    return embed_image(path)


def load_detections() -> list:
    if os.path.exists(META_FILE):
        with open(META_FILE) as f:
            return json.load(f)
    return []


def save_detection(entry: dict):
    data = load_detections()
    data.append(entry)
    with open(META_FILE, "w") as f:
        json.dump(data, f, indent=2)


def update_detection(media_id: str, updates: dict):
    """Update specific fields on an existing detection record by media_id."""
    data = load_detections()
    for record in data:
        if record.get("media_id") == media_id:
            record.update(updates)
            break
    with open(META_FILE, "w") as f:
        json.dump(data, f, indent=2)


def analyze_media_with_gemini(filepath: str) -> str:
    """Analyze the video or image using Gemini Vision to extract context."""
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        return "AI Context unavailable."

    try:
        import google.generativeai as genai
        from PIL import Image
        import cv2

        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = "Analyze this sports media. Describe any sports action, players, logos, or identifying features concisely in 1-2 sentences."
        
        if _is_video(filepath):
            cap = cv2.VideoCapture(filepath)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, total_frames // 2))
            success, frame = cap.read()
            cap.release()
            if success:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb)
                response = model.generate_content([prompt, pil_img])
                return response.text.strip()
        else:
            pil_img = Image.open(filepath).convert("RGB")
            response = model.generate_content([prompt, pil_img])
            return response.text.strip()
            
    except Exception as e:
        return "AI analysis failed."
    return "No visual data extracted."


def ingest_file(filepath: str, filename: str, platform: str = "Unknown") -> dict:
    """Ingest a media file: embed it, store metadata, return record."""
    import datetime, random
    from db.faiss_store import get_media_store

    media_id = str(uuid.uuid4())[:8]
    embed = embed_media(filepath)

    store = get_media_store(dim=embed.shape[0])
    views = random.randint(1000, 500000)
    ts = datetime.datetime.utcnow().isoformat()

    meta = {
        "media_id": media_id,
        "filename": filename,
        "filepath": filepath,
        "platform": platform,
        "timestamp": ts,
        "views": views,
        "revenue_estimate": round(views * 0.003, 2),
        "is_original": False,
        "ai_context": analyze_media_with_gemini(filepath),
    }

    store.add(embed, meta)
    store.save()
    save_detection(meta)
    return meta
