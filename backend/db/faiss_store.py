import faiss
import numpy as np
import json
import os
from typing import List, Tuple, Dict, Any, Optional

FAISS_INDEX_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "indices")


class FAISSStore:
    """Dual FAISS index: one for media embeddings, one for RAG text embeddings."""

    def __init__(self, dim: int = 512, name: str = "media"):
        self.dim = dim
        self.name = name
        self.index = faiss.IndexFlatIP(dim)  # inner product (cosine after normalization)
        self.metadata: List[Dict[str, Any]] = []
        os.makedirs(FAISS_INDEX_DIR, exist_ok=True)

    def add(self, embedding: np.ndarray, meta: Dict[str, Any]):
        """Add a single embedding with metadata."""
        vec = embedding.astype(np.float32).reshape(1, -1)
        # L2 normalize for cosine similarity via inner product
        faiss.normalize_L2(vec)
        self.index.add(vec)
        self.metadata.append(meta)

    def search(self, query: np.ndarray, k: int = 5) -> List[Tuple[float, Dict[str, Any]]]:
        """Search for top-k similar items. Returns list of (score, metadata)."""
        if self.index.ntotal == 0:
            return []
        vec = query.astype(np.float32).reshape(1, -1)
        faiss.normalize_L2(vec)
        k = min(k, self.index.ntotal)
        scores, indices = self.index.search(vec, k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0:
                results.append((float(score), self.metadata[idx]))
        return results

    def save(self):
        """Persist index and metadata to disk."""
        os.makedirs(FAISS_INDEX_DIR, exist_ok=True)
        faiss.write_index(self.index, os.path.join(FAISS_INDEX_DIR, f"{self.name}.index"))
        with open(os.path.join(FAISS_INDEX_DIR, f"{self.name}_meta.json"), "w") as f:
            json.dump(self.metadata, f)

    def load(self) -> bool:
        """Load index and metadata from disk. Returns True if loaded."""
        idx_path = os.path.join(FAISS_INDEX_DIR, f"{self.name}.index")
        meta_path = os.path.join(FAISS_INDEX_DIR, f"{self.name}_meta.json")
        if os.path.exists(idx_path) and os.path.exists(meta_path):
            self.index = faiss.read_index(idx_path)
            with open(meta_path) as f:
                self.metadata = json.load(f)
            return True
        return False

    @property
    def size(self) -> int:
        return self.index.ntotal


# Singleton stores
_media_store: Optional[FAISSStore] = None
_rag_store: Optional[FAISSStore] = None


def get_media_store(dim: int = 512) -> FAISSStore:
    global _media_store
    if _media_store is None:
        _media_store = FAISSStore(dim=dim, name="media")
        _media_store.load()
    return _media_store


def get_rag_store(dim: int = 384) -> FAISSStore:
    global _rag_store
    if _rag_store is None:
        _rag_store = FAISSStore(dim=dim, name="rag")
        _rag_store.load()
    return _rag_store
