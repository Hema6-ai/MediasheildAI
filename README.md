# MediaShield AI 🛡️

> **Protecting ₹50,000 crore in annual sports broadcast revenue from digital piracy — using multimodal AI.**

[![Google Solution Challenge 2026](https://img.shields.io/badge/Google%20Solution%20Challenge-2026-4285F4?style=for-the-badge&logo=google)](https://promptwars.in/solutionchallenge2026.html)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini%202.0%20Flash-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/run)

---

## 🎯 Problem

Sports organizations generate massive volumes of high-value digital media. Official broadcasts are stolen, cropped, watermarked, and redistributed across TikTok, Twitter, and Instagram within minutes — with zero accountability. Existing tools are platform-locked, require pre-embedding, or simply can't scale.

**MediaShield AI detects unauthorized reuse in under 2 seconds — even after cropping, filtering, watermarking, and mirroring.**

---

## 🚀 Live Demo

| Resource | Link |
|---|---|
| 🌐 Frontend Dashboard | [mediashield-ai.vercel.app](https://mediashield-ai.vercel.app) |
| ⚡ Backend API | [Cloud Run URL](https://mediashield-backend-xxx.a.run.app) |
| 📖 API Docs (Swagger) | [/docs](https://mediashield-backend-xxx.a.run.app/docs) |
| 🎬 Demo Video (3 min) | [YouTube](https://youtu.be/your-video-id) |

> Replace placeholder URLs with your actual deployed links.

---

## 🏗️ Architecture

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
│  │(OpenCLIP)│  │(FAISS +  │  └─────────────────────┘  │
│  └──────────┘  │  SSIM)   │  ┌─────────────────────┐  │
│                └──────────┘  │     RAG Agent        │  │
│                              │ (MiniLM + Gemini     │  │
│                              │  1.5 Flash)          │  │
│                              └─────────────────────┘  │
│                              ┌─────────────────────┐  │
│                              │ Explainability Agent │  │
│                              │ (Gemini 2.0 Flash    │  │
│                              │  Vision + OpenCV)    │  │
│                              └─────────────────────┘  │
│                              ┌─────────────────────┐  │
│                              │    Legal Agent       │  │
│                              │  (ReportLab PDF)     │  │
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

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Image Embeddings | OpenCLIP ViT-B-32 |
| Text Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector Search | FAISS (CPU, dual index) |
| LLM | Gemini 2.0 Flash Vision (explainability) + Gemini 1.5 Flash (RAG + ingestion) |
| Similarity Scoring | Cosine (CLIP) × 0.7 + SSIM × 0.3 |
| Propagation Graph | NetworkX |
| Heatmaps | OpenCV (difference saliency + JET colormap) |
| Legal Reports | ReportLab PDF |
| Backend | FastAPI + Uvicorn |
| Frontend | Next.js 14 + Tailwind CSS + D3.js |
| Deployment | Google Cloud Run + Vercel |
| Optional Storage | Firebase Firestore |

---

## 🔬 How It Works

### Similarity Scoring
```
final_score = 0.7 × CLIP_cosine + 0.3 × SSIM

> 0.85   →  🔴 HIGH risk
0.70–0.85 →  🟡 MEDIUM risk
< 0.70   →  🟢 LOW risk
```

### Detection Pipeline
1. **Ingest** — Rights holder uploads official media. OpenCLIP generates 512-dim fingerprint. Gemini Vision creates content description.
2. **Detect** — Suspected pirated media submitted. FAISS finds nearest matches. SSIM validates structural similarity.
3. **Explain** — Gemini 2.0 Flash Vision compares original vs pirated side-by-side. Describes exactly what changed (crop, filter, watermark, mirror).
4. **Evidence** — ReportLab generates DMCA-ready PDF with scores, heatmap, and forensic analysis.
5. **Track** — NetworkX propagation graph maps how content spreads across platforms.
6. **Insights** — RAG pipeline lets rights holders query their detection database in plain English.

### Video Support
Videos are embedded by sampling 1 frame per second → running each frame through OpenCLIP → average-pooling all frame vectors into a single 512-dim fingerprint. A 90-second pirated highlight clip is detected with the same pipeline as images.

---

## 📁 Project Structure

```
mediashield/
├── backend/
│   ├── main.py                     # FastAPI app — all 10 routes
│   ├── agents/
│   │   ├── ingestion_agent.py      # Upload + CLIP embed + Gemini Vision context
│   │   ├── detection_agent.py      # FAISS search + SSIM scoring
│   │   ├── propagation_agent.py    # NetworkX graph builder
│   │   ├── rag_agent.py            # RAG pipeline + Gemini 1.5 Flash
│   │   ├── explainability_agent.py # Gemini 2.0 Flash Vision dual-image + OpenCV heatmaps
│   │   ├── legal_agent.py          # ReportLab PDF legal evidence report
│   │   └── orchestrator.py         # Chains all 6 agents
│   ├── db/
│   │   ├── faiss_store.py          # Dual FAISS index wrapper
│   │   ├── firebase_store.py       # Firebase Firestore (optional)
│   │   └── models.py               # Pydantic models
│   ├── data/
│   │   ├── generate_dataset.py     # Synthetic dataset generator (20 originals + 60 variants)
│   │   ├── detections.json         # Detection metadata store
│   │   ├── graph.json              # Cached propagation graph
│   │   ├── media/                  # Original + synthetic images
│   │   ├── uploads/                # Temp files from /upload and /analyze
│   │   ├── heatmaps/               # Generated OpenCV heatmap JPEGs
│   │   ├── indices/                # FAISS .index + _meta.json files
│   │   └── reports/                # Generated PDF legal reports
│   ├── utils/
│   │   └── similarity.py           # Cosine + SSIM helpers
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Landing page — pitch hero + feature cards
│   │   ├── dashboard/page.tsx      # Upload + analyze + live stats
│   │   ├── detection/page.tsx      # Results table + filters + legal PDF download
│   │   ├── graph/page.tsx          # D3.js propagation graph
│   │   └── insights/page.tsx       # RAG chat panel
│   ├── components/
│   │   ├── MediaUpload.tsx         # Drag-and-drop + platform selector
│   │   ├── DetectionCard.tsx       # Match card with CLIP/SSIM bars + heatmap
│   │   ├── PropagationGraph.tsx    # D3.js force-directed graph
│   │   ├── InsightChat.tsx         # RAG chat UI + suggested questions
│   │   ├── Navbar.tsx              # Sticky glassmorphism nav
│   │   └── RiskBadge.tsx           # HIGH/MEDIUM/LOW pill badge
│   ├── lib/api.ts                  # All typed API calls incl. legalReportUrl()
│   ├── vercel.json
│   └── package.json
├── docker-compose.yml
└── cloudbuild.yaml
```

---

## 🛠️ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone

```bash
git clone https://github.com/Hema6-ai/MediasheildAI.git
cd MediasheildAI
```

### 2. Backend

```bash
cd mediashield/backend

python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env → set GEMINI_API_KEY=your_key_here
```

### 3. Generate Dataset

```bash
python data/generate_dataset.py
```

Generates 20 original sports images + 60 modified variants (crop / blur / color-shift), FAISS indexes, and propagation graph JSON.

### 4. Start Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### 5. Frontend

```bash
cd mediashield/frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000`

### Docker (Full Stack)

```bash
cp backend/.env.example backend/.env
# Add GEMINI_API_KEY to backend/.env
docker-compose up --build
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check + index sizes |
| `POST` | `/upload` | Ingest media → returns `media_id` |
| `POST` | `/analyze` | Full 6-agent pipeline: upload → detect → explain |
| `GET` | `/results` | List all detections (filterable by platform/risk) |
| `GET` | `/graph` | Propagation graph JSON for D3.js |
| `POST` | `/query` | RAG query → Gemini answer |
| `GET` | `/explain/{media_id}` | Heatmap + Gemini forensic explanation |
| `GET` | `/heatmap/{media_id}` | Heatmap image file |
| `GET` | `/legal-report/{media_id}` | Generate + download PDF evidence report |
| `GET` | `/stats` | Summary statistics |

Both `/upload` and `/analyze` accept images and videos (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, `.m4v`).

---

## 🚀 Deployment

### Backend → Google Cloud Run

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

cd mediashield/backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/mediashield-backend

gcloud run deploy mediashield-backend \
  --image gcr.io/YOUR_PROJECT_ID/mediashield-backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY,AUTO_BOOTSTRAP_DATASET=true,CORS_ORIGINS=https://your-app.vercel.app
```

Or with Cloud Build CI/CD:
```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _GEMINI_API_KEY=YOUR_KEY
```

### Frontend → Vercel

```bash
cd mediashield/frontend
npx vercel --prod
```

Set `NEXT_PUBLIC_BACKEND_URL` to your Cloud Run URL in the Vercel dashboard.

### Alternative: Render

Push to GitHub → create Blueprint from `render.yaml` → set `GEMINI_API_KEY` + `CORS_ORIGINS`.

---

## 🌍 Environment Variables

**Backend (`backend/.env`)**
```env
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGINS=https://your-frontend.vercel.app
AUTO_BOOTSTRAP_DATASET=true
FIREBASE_SERVICE_ACCOUNT_PATH=          # optional
```

**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## ✅ Production Checklist

- [ ] `GEMINI_API_KEY` set in Cloud Run environment
- [ ] `CORS_ORIGINS` set to your Vercel domain
- [ ] `AUTO_BOOTSTRAP_DATASET=true` for first startup
- [ ] `NEXT_PUBLIC_BACKEND_URL` set to Cloud Run URL in Vercel
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] End-to-end flow verified: upload → analyze → detection card → legal report PDF

---

## ✨ Key Features

### 🔍 Transformation-Resilient Detection
Detects pirated content even after aggressive modifications — cropping, color filtering, watermarking, mirroring, and resolution degradation. CLIP semantic embeddings capture *what* the content is, not just *how it looks*.

### 🤖 Gemini Vision Forensic Explainability
Sends both the original and suspected pirated images to Gemini 2.0 Flash Vision for side-by-side forensic comparison. Generates human-readable explanations like:
> *"Match detected because the original broadcast frame showing a football penalty kick was cropped to remove stadium branding and overlaid with a TikTok watermark, while core player positioning and field structure remain identical."*

Fallback chain: Gemini Vision → Gemini 1.5 Flash (text-only) → rule-based template.

### 📄 One-Click Legal Evidence Reports
ReportLab PDF containing: detection summary, similarity scores, AI forensic analysis, OpenCV heatmap, revenue loss estimate, and legal disclaimer. Ready to submit as a DMCA Section 512 takedown notice.

### 🎥 Video Support
MP4, MOV, AVI, MKV, WebM — processed via 1 FPS sampling + average-pool CLIP embeddings.

### 🌐 Propagation Graph
NetworkX + D3.js force-directed graph showing how pirated content spreads across platforms. Drag, zoom, hover tooltips, color-coded by risk level.

### 🧠 RAG Insights Chat
Ask plain-English questions over your detection database:
- *"Which platform has the most violations?"*
- *"What is the total estimated revenue loss this week?"*
- *"How many high-risk football clips were detected today?"*

Powered by sentence-transformers retrieval + Gemini 1.5 Flash generation.

