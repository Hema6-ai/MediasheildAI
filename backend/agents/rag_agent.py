import os
import json
import numpy as np
from typing import List, Dict, Any, Tuple
from sentence_transformers import SentenceTransformer
from db.faiss_store import get_rag_store

_st_model = None


def _get_st_model():
    global _st_model
    if _st_model is None:
        _st_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _st_model


def embed_text(text: str) -> np.ndarray:
    return _get_st_model().encode(text, normalize_embeddings=True)


def index_detection(detection: Dict[str, Any]):
    """Add a detection record to the RAG FAISS index."""
    store = get_rag_store(dim=384)
    text = (
        f"Media ID {detection.get('media_id')} detected on {detection.get('platform', 'Unknown')} "
        f"platform at {detection.get('timestamp', 'unknown time')}. "
        f"Risk level: {detection.get('risk_level', 'UNKNOWN')}. "
        f"Final score: {detection.get('final_score', 0):.2f}. "
        f"Views: {detection.get('views', 0)}. "
        f"Estimated revenue loss: ${detection.get('revenue_estimate', 0):.2f}."
    )
    embed = embed_text(text)
    store.add(embed, {"text": text, **detection})
    store.save()


def index_all_detections():
    """Index all detections from detections.json into RAG store."""
    from agents.ingestion_agent import load_detections
    store = get_rag_store(dim=384)
    detections = load_detections()
    for d in detections:
        text = (
            f"Media ID {d.get('media_id')} on {d.get('platform', 'Unknown')} "
            f"risk {d.get('risk_level', 'UNKNOWN')} score {d.get('final_score', 0.7):.2f} "
            f"views {d.get('views', 0)} revenue ${d.get('revenue_estimate', 0):.2f}."
        )
        embed = embed_text(text)
        store.add(embed, {"text": text, **d})
    store.save()


def retrieve(question: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Retrieve top-k relevant context snippets for a question."""
    store = get_rag_store(dim=384)
    if store.size == 0:
        index_all_detections()
    q_embed = embed_text(question)
    results = store.search(q_embed, k=top_k)
    return [meta for _, meta in results]


def answer(question: str) -> Dict[str, Any]:
    """Full RAG pipeline: retrieve context → build prompt → call Gemini (or fallback)."""
    contexts = retrieve(question)
    snippets = [c.get("text", "") for c in contexts]
    context_block = "\n".join(f"- {s}" for s in snippets)

    prompt = f"""You are MediaShield AI, an expert in digital sports media protection.
Answer the user's question using the detection context below.
Be concise, factual, and helpful.

Detection Context:
{context_block}

User Question: {question}

Answer:"""

    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            answer_text = response.text.strip()
        except Exception as e:
            answer_text = _rule_based_answer(question, contexts)
    else:
        answer_text = _rule_based_answer(question, contexts)

    return {
        "answer": answer_text,
        "context_snippets": snippets,
        "sources": len(snippets),
    }


def _rule_based_answer(question: str, contexts: List[Dict]) -> str:
    """Fallback rule-based answers when Gemini is unavailable."""
    q = question.lower()
    platforms = [c.get("platform", "") for c in contexts]
    platform_counts: Dict[str, int] = {}
    for p in platforms:
        platform_counts[p] = platform_counts.get(p, 0) + 1

    if "platform" in q and ("most" in q or "highest" in q or "violation" in q):
        if platform_counts:
            top = max(platform_counts, key=platform_counts.get)
            return f"Based on detection data, {top} has the most violations ({platform_counts[top]} detected cases)."

    if "loss" in q or "revenue" in q or "financial" in q:
        total = sum(c.get("revenue_estimate", 0) for c in contexts)
        return f"Based on retrieved records, estimated revenue loss across top matches is ${total:.2f}."

    if "high risk" in q or "high-risk" in q:
        high = [c for c in contexts if c.get("risk_level") == "HIGH"]
        return f"Found {len(high)} high-risk detections in the top results. These are the most urgent cases."

    if "total" in q and ("detect" in q or "case" in q):
        from agents.ingestion_agent import load_detections
        total = len(load_detections())
        return f"There are {total} total media records in the system."

    # Generic summary
    if contexts:
        return (
            f"Based on {len(contexts)} retrieved records: platforms involved include "
            f"{', '.join(set(platforms))}. "
            f"Risk levels range from LOW to HIGH based on visual similarity scores."
        )
    return "No relevant detection data found to answer your question."
