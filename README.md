# MediaShield AI 🛡️



An AI-powered multi-agent system that **detects**, **tracks**, and **explains** unauthorized usage of digital sports media across platforms.

---

## Architecture

```
Upload / Query
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Orchestrator                  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐  │
│  │Ingestion │→ │Detection │→ │  Propagation Agent  │  │
│  │  Agent   │  │  Agent   │  │  (NetworkX Graph)   │  │
│  │(OpenCLIP)│  │(FAISS+   │  └─────────────────────┘  │
│  └──────────┘  │SSIM)     │                            │
│                └──────────┘  ┌─────────────────────┐  │
│                              │     RAG Agent        │  │
│                              │ (sentence-xformers + │  │
│                              │  Gemini 1.5 Flash)   │  │
│                              └─────────────────────┘  │
│                              ┌─────────────────────┐  │
│                              │ Explainability Agent │  │
│                              │  (Gemini 2.0 Flash   │  │
│                              │   Vision + OpenCV)   │  │
│                              └─────────────────────┘  │
│                                                         │
│  ┌──────────────────────┐  ┌───────────────────────┐  │
│  │   FAISS Media Index  │  │   FAISS RAG Index     │  │
│  │  (OpenCLIP 512-dim)  │  │ (MiniLM-L6 384-dim)   │  │
│  └──────────────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────┘
     │
     ▼
Next.js 14 Frontend (Vercel)
  Landing · Dashboard · Detections · Graph · Insights
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Image Embeddings | OpenCLIP ViT-B-32 |
| Text Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector Search | FAISS (CPU, dual index) |
| LLM | Gemini 2.0 Flash Vision (explainability) + Gemini 1.5 Flash (RAG, ingestion context) |
| Similarity Scoring | Cosine (CLIP) × 0.7 + SSIM × 0.3 |
| Propagation Graph | NetworkX |
| Heatmaps | OpenCV (difference saliency) |
| Backend | FastAPI + Uvicorn |
| Frontend | Next.js 14 + Tailwind CSS + D3.js |
| Deployment | Google Cloud Run + Vercel |

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone & Setup Backend

```bash
cd mediashield/backend

# Create virtual environment (recommended)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure API key
cp .env.example .env
# Edit .env and set: GEMINI_API_KEY=your_key_here
```

### 2. Generate Sample Dataset

```bash
# From backend/ directory (with venv active)
python data/generate_dataset.py
```

This generates:
- 20 original sports images
- 60 modified variants (crop / blur / color-shift)
- FAISS indexes for media + RAG
- Propagation graph JSON

### 3. Start Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at **http://localhost:8000**  
API docs at **http://localhost:8000/docs**

### 4. Setup & Start Frontend

```bash
cd mediashield/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check + index sizes |
| `POST` | `/upload` | Ingest media, return `media_id` |
| `POST` | `/analyze` | Full pipeline: upload → detect → explain |
| `GET` | `/results` | List all detections (filterable) |
| `GET` | `/graph` | Propagation graph JSON for D3.js |
| `POST` | `/query` | RAG query → Gemini answer |
| `GET` | `/explain/{media_id}` | Heatmap + text explanation |
| `GET` | `/heatmap/{media_id}` | Heatmap image file |
| `GET` | `/legal-report/{media_id}` | Generate + download PDF legal evidence report |
| `GET` | `/stats` | Summary statistics |

`/upload` and `/analyze` support both image and video files. Videos are embedded by sampling one frame per second and average-pooling CLIP vectors.

---

## Similarity Scoring

```
final_score = 0.7 × CLIP_cosine + 0.3 × SSIM

> 0.85  →  HIGH risk  🔴
0.70–0.85 →  MEDIUM risk 🟡
< 0.70  →  LOW risk   🟢
```



### 🚀 Frontend → Vercel (Primary)

**Via Vercel Dashboard (recommended):**
1. Go to [vercel.com](https://vercel.com) → **New Project** → Import `MediasheildAI` from GitHub.
2. Set **Root Directory** to `mediashield/frontend`.
3. Add environment variable in Vercel dashboard:
   ```
   NEXT_PUBLIC_BACKEND_URL = https://YOUR_CLOUD_RUN_URL
   ```
4. Click **Deploy** — Vercel auto-detects Next.js and builds it.

**Via CLI:**
```bash
cd mediashield/frontend
npm install -g vercel
vercel --prod
```

---

### ☁️ Backend → Google Cloud Run (Primary)

```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build & deploy
cd mediashield/backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/mediashield-backend

gcloud run deploy mediashield-backend \
  --image gcr.io/YOUR_PROJECT_ID/mediashield-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_API_KEY,CORS_ORIGINS=https://your-app.vercel.app
```

**Or with Cloud Build CI/CD** (uses `cloudbuild.yaml`):
```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

### Alternative Backends

**Render** — one-click deploy using `render.yaml`:
1. Push repo to GitHub (`https://github.com/Hema6-ai/MediasheildAI`).
2. In Render, create a **Blueprint** and select this repo.
3. Set `GEMINI_API_KEY` and `CORS_ORIGINS=https://your-app.vercel.app`.

**Railway:**
1. Create a new Railway project from this repo, set root directory to `backend`.
2. Add env vars: `GEMINI_API_KEY`, `CORS_ORIGINS`.

---

### Local Docker Compose

```bash
# From mediashield/ root
cp backend/.env.example backend/.env
# Edit backend/.env to add your GEMINI_API_KEY

docker-compose up --build
# Backend: http://localhost:8000  Frontend: http://localhost:3000
```

## Production Checklist

- Backend environment variables set: `GEMINI_API_KEY` (optional), `CORS_ORIGINS` (set to your frontend domain in production).
- Backend bootstrap behavior: `AUTO_BOOTSTRAP_DATASET=true` auto-generates baseline dataset on first startup if detections/indexes are missing.
- Frontend environment variable set: `NEXT_PUBLIC_BACKEND_URL` (public URL of backend API).
- Generate baseline dataset once after first backend deployment by running `python data/generate_dataset.py`.
- Verify API health endpoint: `GET /health` returns status ok and non-failing index reads.
- Verify end-to-end flow in UI: upload image/video -> analyze -> see matches, explanation, and graph data.
- Validate CORS by calling backend from deployed frontend domain only.
- Keep dependencies current (frontend now uses patched `next@15.5.15` line and matching `eslint-config-next`).

---

## Project Structure

```
mediashield/
├── backend/
│   ├── main.py                    # FastAPI app, all 10 routes
│   ├── agents/
│   │   ├── ingestion_agent.py     # Upload + CLIP embed + Gemini Vision context
│   │   ├── detection_agent.py     # FAISS search + SSIM scoring
│   │   ├── propagation_agent.py   # NetworkX graph builder
│   │   ├── rag_agent.py           # RAG pipeline + Gemini 1.5 Flash
│   │   ├── explainability_agent.py# Gemini 2.0 Flash Vision dual-image + OpenCV heatmaps
│   │   ├── legal_agent.py         # ReportLab PDF legal evidence report
│   │   └── orchestrator.py        # Chains all 6 agents
│   ├── db/
│   │   ├── faiss_store.py         # Dual FAISS index wrapper
│   │   ├── firebase_store.py      # Firebase Firestore integration (optional)
│   │   └── models.py              # Pydantic models
│   ├── data/
│   │   ├── generate_dataset.py    # Synthetic dataset generator
│   │   ├── detections.json        # Detection metadata store
│   │   ├── graph.json             # Cached propagation graph
│   │   ├── media/                 # Original + synthetic images
│   │   ├── uploads/               # Temp files from /upload and /analyze
│   │   ├── heatmaps/              # Generated OpenCV heatmap JPEGs
│   │   ├── indices/               # FAISS .index + _meta.json files
│   │   └── reports/               # Generated PDF legal reports
│   ├── utils/
│   │   └── similarity.py          # Cosine + SSIM helpers
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Landing page (pitch hero + feature cards)
│   │   ├── dashboard/page.tsx     # Upload + analyze + live stats
│   │   ├── detection/page.tsx     # Results table + filters + legal PDF download
│   │   ├── graph/page.tsx         # D3.js propagation graph
│   │   └── insights/page.tsx      # RAG chat panel (Gemini powered)
│   ├── components/
│   │   ├── MediaUpload.tsx        # Drag-and-drop + platform selector
│   │   ├── DetectionCard.tsx      # Match card with CLIP/SSIM bars + heatmap
│   │   ├── PropagationGraph.tsx   # D3.js force-directed graph
│   │   ├── InsightChat.tsx        # RAG chat UI with suggested questions
│   │   ├── Navbar.tsx             # Sticky glassmorphism nav
│   │   └── RiskBadge.tsx          # HIGH/MEDIUM/LOW pill badge
│   ├── lib/api.ts                 # All typed API calls incl. legalReportUrl()
│   ├── vercel.json
│   └── package.json
├── docker-compose.yml
└── cloudbuild.yaml
```

---

## Environment Variables

**Backend (`backend/.env`)**
```
GEMINI_API_KEY=your_gemini_api_key_here          # Enables Gemini Vision + RAG + ingestion context
CORS_ORIGINS=https://your-frontend.vercel.app    # Comma-separated; defaults to * in dev
AUTO_BOOTSTRAP_DATASET=true                      # Auto-generate dataset on first startup
FIREBASE_SERVICE_ACCOUNT_PATH=                   # Optional: path to Firebase service account JSON
```

**Frontend (`frontend/.env.local`)**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Enhancements (Hackathon Finals)

All upgrades made during the Grand Finale preparation:

### 1. 🔍 Gemini Vision — Dual-Image Explainability
**File:** `agents/explainability_agent.py`

The explainability agent now sends **both** the original broadcast image and the suspected pirated version to **Gemini 2.0 Flash Vision** for side-by-side forensic comparison. Instead of reciting numbers, it describes exactly what changed:

> *"Match detected because the original broadcast frame showing a football penalty kick was cropped to remove stadium branding and overlaid with a TikTok watermark, while core player positioning and field structure remain identical."

**Fallback chain:** Gemini Vision → Gemini 1.5 Flash (text-only) → rule-based template.

### 2. 📄 Legal Evidence PDF Reports
**Files:** `agents/legal_agent.py`, `main.py` (`GET /legal-report/{media_id}`)

One-click PDF generation using ReportLab. Each report contains:
- Detection summary table (Media ID, date, platform, risk level, views, revenue loss estimate)
- AI Explainability Analysis (Gemini-generated forensic text)
- Visual Evidence section (embedded similarity heatmap image)
- Official legal disclaimer footer

Download button visible in the Detections page detail panel for every flagged item.

### 3. 🎥 Video File Support
**File:** `agents/ingestion_agent.py`

Both `/upload` and `/analyze` accept video files (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.m4v`). Videos are processed by:
1. Sampling 1 frame per second with OpenCV
2. Running each frame through OpenCLIP ViT-B-32
3. Average-pooling all frame embeddings into a single 512-dim vector

This means a 90-second pirated highlight clip is compared against the indexed library with the same pipeline as images.

### 4. 🤖 Gemini Vision in Ingestion
**File:** `agents/ingestion_agent.py` → `analyze_media_with_gemini()`

On every upload, Gemini 1.5 Flash Vision analyzes the media and generates a 1-2 sentence content description (e.g., "Football match showing a penalty kick by player #10 in a stadium"). Stored as `ai_context` in the detection record — queryable via the RAG agent.

### 5. 🔥 Firebase Firestore Integration
**File:** `db/firebase_store.py`

Optional scalable metadata store. When `FIREBASE_SERVICE_ACCOUNT_PATH` is set:
- Detections are written to a `detections` Firestore collection
- Reads fall back to local JSON if Firebase is unavailable

Allows horizontal scaling across multiple backend instances without shared filesystem.

### 6. 🧠 RAG + Gemini Q&A Insights
**File:** `agents/rag_agent.py`

Natural-language Q&A over your detection database powered by sentence-transformers (retrieval) and Gemini 1.5 Flash (generation). Ask questions like:
- *"Which platform has the most violations?"*
- *"What is the total estimated revenue loss?"*
- *"How many high-risk NBA clips were detected today?"*

Full chat UI at `/insights` with suggested questions and context snippet disclosure.

### 7. 🌐 Premium UI/UX
**Files:** `frontend/app/globals.css`, all page and component files

- Dark glassmorphism design (`backdrop-filter: blur`)
- 3D tilt-card hover effects (`perspective(1200px) rotateX/Y`)
- Animated gradient hero with isometric mockup
- D3.js force-directed propagation graph (drag, zoom, hover tooltips)
- Risk-colored score bars (CLIP cyan, SSIM purple)
- Pitch hook: *"₹50,000 crore of sports broadcast revenue lost annually"*

