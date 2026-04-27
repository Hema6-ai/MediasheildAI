import numpy as np
from skimage.metrics import structural_similarity as ssim
from PIL import Image
import cv2
from typing import Tuple


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    a = a.flatten().astype(np.float32)
    b = b.flatten().astype(np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def compute_ssim(img1: np.ndarray, img2: np.ndarray) -> float:
    """Compute SSIM between two images (numpy arrays)."""
    # Resize to same shape
    h, w = min(img1.shape[0], img2.shape[0]), min(img1.shape[1], img2.shape[1])
    img1_r = cv2.resize(img1, (w, h))
    img2_r = cv2.resize(img2, (w, h))

    # Convert to grayscale if needed
    if len(img1_r.shape) == 3:
        img1_r = cv2.cvtColor(img1_r, cv2.COLOR_BGR2GRAY)
    if len(img2_r.shape) == 3:
        img2_r = cv2.cvtColor(img2_r, cv2.COLOR_BGR2GRAY)

    score, _ = ssim(img1_r, img2_r, full=True, data_range=255)
    return float(score)


def combined_score(clip_cosine: float, ssim_score: float) -> float:
    """Weighted combination: 70% CLIP cosine + 30% SSIM."""
    return 0.7 * clip_cosine + 0.3 * ssim_score


def risk_level(score: float) -> str:
    if score > 0.85:
        return "HIGH"
    elif score >= 0.70:
        return "MEDIUM"
    else:
        return "LOW"


def load_image_array(path: str, size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    """Load image/video as numpy array, resized (first frame for video)."""
    ext = path.lower().rsplit(".", 1)[-1] if "." in path else ""
    if ext in {"mp4", "mov", "avi", "mkv", "webm", "m4v"}:
        cap = cv2.VideoCapture(path)
        ok, frame = cap.read()
        cap.release()
        if not ok or frame is None:
            raise ValueError(f"Unable to read first frame from video: {path}")
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame = cv2.resize(frame, size)
        return frame

    img = Image.open(path).convert("RGB").resize(size)
    return np.array(img)
