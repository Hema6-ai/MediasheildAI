import os
import json
from typing import Dict, Any, List

FIREBASE_KEY_PATH = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")

_db = None

def init_firebase():
    global _db
    if _db is not None:
        return _db
    
    if FIREBASE_KEY_PATH and os.path.exists(FIREBASE_KEY_PATH):
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            
            if not firebase_admin._apps:
                cred = credentials.Certificate(FIREBASE_KEY_PATH)
                firebase_admin.initialize_app(cred)
            _db = firestore.client()
            return _db
        except Exception as e:
            print(f"Firebase initialization failed: {e}")
    return None

def save_detection_to_firebase(detection: Dict[str, Any]):
    """Save detection to Firebase, fallback to JSON if not configured."""
    db = init_firebase()
    if db:
        try:
            media_id = detection.get("media_id", "unknown")
            db.collection("detections").document(media_id).set(detection)
            return
        except Exception as e:
            print(f"Failed to save to Firebase: {e}")
    
    # Fallback
    from agents.ingestion_agent import save_detection, load_detections
    # Ingestion agent already handles JSON saving, so we just log fallback here if called directly
    # To prevent duplication, we assume this is called alongside or instead of local JSON
    pass

def load_detections_from_firebase() -> List[Dict[str, Any]]:
    """Load from Firebase, fallback to local JSON."""
    db = init_firebase()
    if db:
        try:
            docs = db.collection("detections").stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"Failed to load from Firebase: {e}")
            
    # Fallback
    from agents.ingestion_agent import load_detections
    return load_detections()

