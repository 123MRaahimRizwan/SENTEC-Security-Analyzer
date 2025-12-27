# SENTEC Security Analyzer 🛡️

A RAG-based (Retrieval-Augmented Generation) threat intelligence system that detects anomalies in server logs and provides contextualized, prioritized security alerts with LLM-generated mitigation plans, citations, and comprehensive performance metrics.

## Overview

SENTEC Security Analyzer combines machine learning-based anomaly detection with vector database-powered RAG pipeline to deliver intelligent security threat analysis. The system:

- **Detects anomalies** in server logs using Isolation Forest algorithm
- **Retrieves relevant context** from security policy documents via Qdrant vector database
- **Generates intelligent analysis** using Groq's LLM (Llama models)
- **Provides actionable mitigations** with citations and CVE/CWE/MITRE references
- **Tracks performance metrics** including accuracy, relevance, and response time
- **Generates PDF reports** with detailed security analysis

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  server_logs    │     │  ground_truth   │
│  (CSV/JSON)     │     │  (labels)       │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Anomaly Detector│────▶│   Validation    │
│ (Isolation      │     │  Metrics Track  │
│  Forest)        │     └─────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  RAG Pipeline   │◀───▶│  Vector DB      │
│  (Groq LLM)     │     │  (Qdrant)       │
│                 │     │  + PDF Chunks   │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Dashboard     │
│ • Alerts        │
│ • Metrics       │
│ • Reports       │
│ • Charts        │
└─────────────────┘
```

## Features

### 🔍 Anomaly Detection
- Isolation Forest-based anomaly detection
- Feature engineering with TF-IDF vectorization
- Real-time log file upload and processing
- Anomaly scoring and prioritization

### 🤖 RAG Pipeline
- PDF document ingestion and chunking
- Vector embeddings using Sentence Transformers
- Semantic search via Qdrant vector database
- Context-aware LLM analysis using Groq API (Llama 3.1 models)
- Automatic citation extraction and source references

### 📊 Performance Metrics
- **Critical Alerts Accuracy**: Tracks prediction accuracy against ground truth
- **Mitigation Relevance**: Measures quality of LLM-generated mitigations (with user ratings)
- **Response Time Reduction**: Monitors analysis speed vs baseline (30-minute manual analysis)

### 📄 Reports & Export
- Comprehensive security reports with incidents, threats, and assets
- PDF report generation with beautiful formatting
- Downloadable reports with detailed analysis

### 🎨 Modern Dashboard
- Real-time alert monitoring
- Interactive anomaly charts
- Performance metrics visualization
- RAG pipeline visualization
- Responsive design with dark theme

## Project Structure

```
SENTEC-Security-Analyzer/
├── backend/
│   ├── app.py                    # Flask API server
│   ├── hugging_face.py           # Groq LLM integration
│   ├── rag_orchestration.py      # RAG pipeline logic
│   ├── setup_vector_db.py        # Qdrant initialization
│   ├── pdf_injestion.py          # PDF processing and chunking
│   ├── log_feature_pipeline.py   # Feature engineering
│   ├── isolation_forest_model.py # Anomaly detection model
│   ├── metrics_tracker.py        # Performance metrics tracking
│   ├── requirements.txt          # Python dependencies
│   └── qdrant_db/                # Local Qdrant database
│
├── frontend/
│   └── client/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx      # Main dashboard
│       │   │   ├── Reports.tsx        # Reports page
│       │   │   ├── Incidents.tsx      # Incidents view
│       │   │   ├── Intelligence.tsx   # Threat intelligence
│       │   │   └── Assets.tsx         # Assets view
│       │   ├── components/
│       │   │   ├── dashboard/
│       │   │   │   ├── AlertCard.tsx           # Alert display
│       │   │   │   ├── AnomalyChart.tsx        # Chart visualization
│       │   │   │   ├── PerformanceMetrics.tsx  # Metrics dashboard
│       │   │   │   └── RagPipelineVisual.tsx   # RAG visualization
│       │   │   └── layout/
│       │   │       └── Sidebar.tsx             # Navigation sidebar
│       │   └── lib/
│       │       └── api-config.ts      # API configuration
│       ├── package.json
│       └── vite.config.ts
│
├── dataset/
│   ├── server_logs.json          # Raw unlabeled logs (775 events)
│   ├── server_logs.csv           # Same in CSV format
│   ├── ground_truth.json         # Event ID → Attack type mapping
│   ├── knowledge_base.json       # CVE/CWE/MITRE reference data
│   └── dataset_stats.json        # Dataset statistics
│
├── Security_Policy_Ingestion.pdf # Security policy document for RAG
└── README.md
```

## Tech Stack

### Backend
- **Python 3.10+**
- **Flask 3.0** - Web framework
- **Flask-CORS** - Cross-origin resource sharing
- **scikit-learn** - Isolation Forest anomaly detection
- **pandas/numpy** - Data processing
- **Qdrant Client** - Vector database
- **Sentence Transformers** - Text embeddings
- **Groq API** - LLM inference (Llama 3.1 models)
- **pypdf** - PDF processing

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS
- **Radix UI** - Component primitives
- **Framer Motion** - Animations
- **Recharts** - Chart visualization
- **TanStack Query** - Data fetching and caching
- **jsPDF** - PDF generation
- **Wouter** - Routing

## Prerequisites

- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Groq API Key** - Get one at [console.groq.com](https://console.groq.com) (free tier available)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SENTEC-Security-Analyzer
```

### 2. Setup Backend

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set Groq API Key (optional, can also set in hugging_face.py)
# Windows (PowerShell):
$env:GROQ_API_KEY="your-api-key-here"
# macOS/Linux:
export GROQ_API_KEY="your-api-key-here"

# Run the Flask server
python app.py
```

> ⚠️ **Note:** Always activate the virtual environment before running the backend.

The backend will start at: **http://127.0.0.1:5000**

The backend automatically:
- Initializes Qdrant vector database
- Loads and trains the anomaly detection model
- Ingests the security policy PDF (if available)

### 3. Setup Frontend

Open a **new terminal** and run:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev:client
```

The frontend will start at: **http://localhost:5000** (or another port if 5000 is taken)

## Usage

### 1. Upload Log Files

1. Navigate to the Dashboard
2. Click "Upload Logs" button
3. Select a CSV or JSON file with server logs
4. The system will automatically:
   - Detect anomalies
   - Generate alerts
   - Display results on the dashboard

### 2. Analyze Alerts

1. View detected alerts on the Dashboard
2. Click "Analyze with RAG" on any alert
3. The system will:
   - Retrieve relevant context from vector database
   - Generate security analysis using LLM
   - Display mitigations with citations
4. Click "View LLM Response" to see detailed analysis

### 3. View Performance Metrics

- Metrics are automatically tracked and displayed on the Dashboard
- Metrics include:
  - Critical Alerts Accuracy (vs ground truth)
  - Mitigation Relevance (with user ratings)
  - Response Time Reduction (vs 30-minute baseline)

### 4. Generate Reports

1. Navigate to the Reports page
2. View available security reports
3. Click on any report to see details
4. Click "Download Report" to generate a PDF

### 5. Rate Mitigations

- After viewing LLM analysis, you can rate the mitigation quality (1-5 stars)
- Ratings are used to calculate mitigation relevance metrics

## API Endpoints

### Alerts & Analysis
- `POST /api/upload-logs` - Upload and analyze log files (CSV/JSON)
- `GET /api/alerts` - Get all detected alerts
- `POST /api/analyze-alert` - Analyze a specific alert with RAG pipeline
- `GET /api/anomaly-chart-data` - Get chart data for anomaly visualization
- `POST /api/rag-search` - Perform semantic search in vector database

### Data Retrieval
- `GET /api/incidents` - Get security incidents
- `GET /api/threat-intel` - Get threat intelligence data
- `GET /api/assets` - Get affected assets
- `GET /api/reports` - Get all security reports
- `GET /api/reports/<report_id>` - Get detailed report information
- `GET /api/last-upload-summary` - Get summary of last log upload

### Vector Database & PDF
- `POST /api/pdf-ingest` - Ingest and process PDF documents
- `POST /api/setup-vector-db` - Initialize or reset vector database

### Metrics & Performance
- `GET /api/metrics` - Get all performance metrics (accuracy, relevance, response time)
- `POST /api/metrics/mitigation-feedback` - Submit user feedback/rating (1-5 stars)
- `POST /api/metrics/clear` - Clear all metrics data

### System & Utilities
- `GET /api/health` - Health check endpoint (checks vector DB and model status)
- `POST /api/clear-all-data` - Clear all uploaded data and analysis results
- `GET /` - API information and available endpoints

## Dataset

The system includes a synthetic dataset with **775 server log events**:

| Category | Count | Percentage |
|----------|-------|------------|
| Normal Events | 500 | 64.5% |
| Malicious Events | 275 | 35.5% |

### Attack Types

| Attack Type | Count | Description |
|-------------|-------|-------------|
| DOS | 100 | Rapid request flood from single IP |
| PORT_SCAN | 50 | Multiple connection attempts to various ports |
| BRUTE_FORCE | 30 | Repeated failed login attempts |
| SQL_INJECTION | 25 | Malicious SQL in query parameters |
| XSS | 20 | Cross-site scripting payloads |
| UNAUTHORIZED_ACCESS | 20 | Requests to sensitive endpoints |
| PATH_TRAVERSAL | 15 | Directory traversal attempts |
| COMMAND_INJECTION | 15 | OS command injection payloads |

### Dataset Files

- **server_logs.json/csv**: Raw unlabeled logs for anomaly detection
- **ground_truth.json**: Event ID → Attack type mapping for validation
- **knowledge_base.json**: CVE/CWE/MITRE reference data for RAG

## RAG Pipeline

The RAG (Retrieval-Augmented Generation) pipeline:

1. **Ingestion**: PDF documents are chunked and embedded
2. **Storage**: Embeddings stored in Qdrant vector database
3. **Retrieval**: Relevant chunks retrieved based on alert context
4. **Generation**: LLM (via Groq) generates analysis using retrieved context
5. **Citation**: Source chunks are cited in the response

### PDF Ingestion

The system automatically ingests `Security_Policy_Ingestion.pdf` on startup. This document contains security policies and best practices that inform the LLM's analysis and mitigation recommendations.

## Performance Metrics

### Critical Alerts Accuracy
- Compares predicted severity (from LLM) vs actual severity (from ground truth)
- Calculates exact match accuracy and critical alerts accuracy
- Only metrics with ground truth data are shown

### Mitigation Relevance
- Based on citation scores (vector similarity)
- User ratings (1-5 stars) from feedback
- Converted to letter grades (A+ to F)

### Response Time Reduction
- Tracks analysis time for each alert
- Compares against 30-minute baseline (typical manual analysis)
- Calculates speedup factor and time reduction percentage

## Configuration

### Groq API Key

Set your Groq API key in `backend/hugging_face.py` or as an environment variable:

```python
GROQ_API_KEY = "your-api-key-here"
```

### Model Selection

Default model: `llama-3.1-70b-versatile`

You can change the model in `backend/hugging_face.py`:

```python
MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.1-70b-versatile")
```

Available models:
- `llama-3.1-70b-versatile` - Best for complex tasks
- `llama-3.1-8b-instant` - Fastest
- `mixtral-8x7b-32768` - Good balance
- `gemma2-9b-it` - Efficient

### Vector Database

Qdrant runs locally by default. The database is stored in `backend/qdrant_db/`.

## Troubleshooting

### CORS Errors
- Ensure the Flask backend is running on port 5000
- Check CORS configuration in `backend/app.py`

### Port Already in Use
- Backend default: `5000` - Change in `app.py`
- Frontend default: `5000` - Change in `vite.config.ts` or use different port

### Vector Database Not Initialized
- Ensure `Security_Policy_Ingestion.pdf` is in the project root
- Check Qdrant initialization logs on backend startup
- Vector DB will be created automatically if PDF is found

### Groq API Errors
- Verify API key is set correctly
- Check API rate limits (free tier has limits)
- Ensure internet connection for API calls

### Missing Dependencies
- Backend: `pip install -r requirements.txt`
- Frontend: `npm install`

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
python app.py  # Runs in debug mode
```

### Frontend Development

```bash
cd frontend
npm run dev:client  # Starts Vite dev server with hot reload
```

## Project Status

✅ **Implemented Features:**
- Anomaly detection with Isolation Forest
- RAG pipeline with Qdrant vector database
- LLM analysis via Groq API
- Performance metrics tracking
- PDF report generation
- Modern React dashboard
- Real-time alert monitoring
- User feedback system

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using React, Flask, Qdrant, and Groq LLM**
