import networkx as nx
import json
import os
from typing import Dict, Any, List
from agents.ingestion_agent import load_detections

GRAPH_CACHE = os.path.join(os.path.dirname(__file__), "..", "data", "graph.json")


def build_propagation_graph() -> Dict[str, Any]:
    """
    Build a propagation graph from detection data.
    Originals are hubs; modified copies are leaf nodes connected to originals.
    """
    detections = load_detections()
    G = nx.DiGraph()

    originals = [d for d in detections if d.get("is_original")]
    copies = [d for d in detections if not d.get("is_original")]

    for orig in originals:
        G.add_node(
            orig["media_id"],
            platform=orig.get("platform", "Unknown"),
            risk_level="LOW",
            views=orig.get("views", 0),
            timestamp=orig.get("timestamp", ""),
            is_original=True,
            filename=orig.get("filename", ""),
        )

    for copy in copies:
        G.add_node(
            copy["media_id"],
            platform=copy.get("platform", "Unknown"),
            risk_level=copy.get("risk_level", "MEDIUM"),
            views=copy.get("views", 0),
            timestamp=copy.get("timestamp", ""),
            is_original=False,
            filename=copy.get("filename", ""),
        )
        # Link copy to its original based on filename prefix
        base = copy.get("filename", "").split("_")[0]
        matched_orig = next(
            (o for o in originals if o.get("filename", "").startswith(base)), None
        )
        if matched_orig:
            score = copy.get("final_score", 0.75)
            G.add_edge(matched_orig["media_id"], copy["media_id"], weight=score)
        elif originals:
            # Attach to a random original to keep graph connected
            import random
            orig = random.choice(originals)
            G.add_edge(orig["media_id"], copy["media_id"], weight=0.65)

    nodes = [
        {
            "id": n,
            "platform": G.nodes[n].get("platform", "Unknown"),
            "risk_level": G.nodes[n].get("risk_level", "LOW"),
            "views": G.nodes[n].get("views", 0),
            "timestamp": G.nodes[n].get("timestamp", ""),
            "is_original": G.nodes[n].get("is_original", False),
            "filename": G.nodes[n].get("filename", ""),
        }
        for n in G.nodes()
    ]

    edges = [
        {
            "source": u,
            "target": v,
            "weight": round(G.edges[u, v].get("weight", 0.7), 4),
        }
        for u, v in G.edges()
    ]

    graph_data = {"nodes": nodes, "edges": edges}

    # Cache to disk
    with open(GRAPH_CACHE, "w") as f:
        json.dump(graph_data, f)

    return graph_data


def load_cached_graph() -> Dict[str, Any]:
    if os.path.exists(GRAPH_CACHE):
        with open(GRAPH_CACHE) as f:
            return json.load(f)
    return build_propagation_graph()
