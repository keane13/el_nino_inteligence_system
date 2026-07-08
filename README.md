# 🌏 El Niño Crisis Intelligence

> **Google Cloud + Gemini AI Hackathon 2026**  
> **Platform:** AI-powered crisis intelligence & real-time monitoring system for El Niño disasters in Indonesia.




https://github.com/user-attachments/assets/a503366e-32c6-4948-add1-b5d47387f3cb



## 🎯 Overview
**El Niño Crisis Intelligence** is a smart analytics and decision-support platform designed to mitigate the severe 2026 El Niño crisis in Indonesia. By unifying fragmented data across government agencies into a single hub, it empowers decision-makers and emergency responders with real-time insights, natural language querying (NLQ), and automated threat alerts.

## 🔥 The Problem & Our Solution
* **The Threat:** Severe drought, widespread wildfires, hazardous air quality (PM2.5), and water scarcity affecting millions.
* **The Bottleneck:** Fragmented data across disparate government agencies and slow, manual data analysis.
* **The Solution:** A unified API integrating **Google BigQuery** and **Google Cloud Storage (GCS)**, powered by a **Multi-Agent Gemini AI** system. The AI reads contextual policy documents, queries massive datasets via NLQ, and instantly generates actionable visualizations.

## ✨ Key Features
- **🤖 Multi-Agent AI Assistant:** Hierarchical Gemini architecture answering queries, generating charts, and citing BigQuery/GCS sources.
- **🗺️ Real-Time Intelligence Map:** Geospatial monitoring of wildfire hotspots, drought indices, reservoir levels, and citizen complaints.
- **🔮 Predictive Analytics:** Forecasting engine for anticipating threats and analyzing 7-day hazard trends.
- **🚨 Smart Alert & Dispatch:** Automated webhook integrations for real-time Telegram dispatch to field officers.
- **🔒 Enterprise-Grade Guardrails:** Built-in LLM safety systems to block toxicity, prompt injections, and PII leaks.

## 🔄 Multi-Agent Workflow
Our AI system utilizes a strict orchestration pattern (Google ADK inspired) to route user queries efficiently and safely:

```text
USER INPUT (Text / Map Clicks)
         │
         ▼
┌──────────────────────┐
│   GUARDRAILS AGENT   │ Blocks toxicity, PII, and prompt injections
└──────────┬───────────┘
           │ (If Safe)
           ▼
┌──────────────────────┐
│   SUPERVISOR AGENT   │ Classifies intent (Simple, Data, Analysis, Chart, Hybrid)
└──────────┬───────────┘
           │
    ┌──────┴───────────────────────────┐
    │ SIMPLE                           │ DATA / ANALYSIS / CHART
    │                                  ▼
    │                    ┌────────────────────────────┐
    │                    │     SEARCH DATA AGENT      │ Queries BigQuery & reads GCS docs
    │                    └──────────────┬─────────────┘
    │                                   │
    │                    ┌──────────────▼─────────────┐
    │                    │    NLQ ANALYTICS AGENT     │ Generates insights & predictions
    │                    └──────────────┬─────────────┘
    │                                   │
    │                    ┌──────────────▼─────────────┐
    │                    │        CHART AGENT         │ Outputs JSON for UI visualizations
    │                    └──────────────┬─────────────┘
    │                                   │
    └──────────────────────┬────────────┘
                           ▼
             ┌─────────────────────────┐
             │    GENERATION AGENT     │ Formats Markdown, tables, and citations
             └─────────────┬───────────┘
                           │
                           ▼
                  RESPONSE TO USER
         (Traced & Monitored via LangSmith)
```

## 📁 Folder Structure
The repository follows a clean, Vertical Slice Architecture for the backend and Next.js App Router for the frontend:

```text
jakarta-pulse-v2/
├── backend/                             # FastAPI Backend
│   ├── main.py                          # FastAPI entry point
│   ├── core/                            # Redis caching, state management, guardrails
│   ├── data/                            # Raw data (JSON/CSV) & GCS document references
│   └── features/                        # Vertical Slice Architecture
│       ├── chat/                        # Multi-Agent AI orchestration (Gemini API) & tools
│       ├── data/                        # Complaint & prediction API routes
│       ├── elnino/                      # Drought, fire, air quality endpoints
│       └── webhooks/                    # Telegram alerting endpoint
│
└── frontend/                            # Next.js 16 Frontend
    ├── app/
    │   ├── page.tsx                     # Main overview (Map + Triage)
    │   ├── chat/page.tsx                # AI Chatbot interface
    │   ├── analytics/page.tsx           # Analytics dashboard
    │   └── predictions/page.tsx         # ML Predictions page
    └── components/
        ├── MapView.tsx                  # Leaflet map (hotspots, drought, reservoirs)
        ├── ChatPanel.tsx                # AI Chat UI with dynamic loading states
        ├── TriageList.tsx               # Multi-tab triage sidebar
        └── KPIBar.tsx                   # Live header metrics
```

## 🏗️ Tech Stack
* **AI & Data:** Google Gemini API (`gemini-flash-lite-latest`), Google BigQuery, Google Cloud Storage, LangSmith.
* **Backend:** Python 3.13, FastAPI, Pandas, Redis, Guardrails-AI.
* **Frontend:** Next.js 16, React 19, TailwindCSS v4, Leaflet.js, Recharts.
* **Infrastructure:** Docker & Google Cloud Run.

---
*Built for the Google Cloud Hackathon to demonstrate the power of AI in proactive disaster management.*
