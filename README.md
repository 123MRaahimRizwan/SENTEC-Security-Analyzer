# Sentinel-RAG 🛡️

A RAG-based threat intelligence system that detects anomalies in server logs and provides contextualized, prioritized security alerts with LLM-generated mitigation plans.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  server_logs    │     │  ground_truth   │
│  (raw data)     │     │  (labels)       │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Anomaly Detector│────▶│   Validation    │
└────────┬────────┘     │  "95% accurate" │
         │              └─────────────────┘
         ▼
┌─────────────────┐     ┌─────────────────┐
│  RAG Pipeline   │◀───▶│ Knowledge Base  │
│  (LangChain)    │     │ (CVE/CWE/MITRE) │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Dashboard     │
│ Alert + Fix +   │
│   Citation      │
└─────────────────┘
```


## Project Structure

```
sentec-hackathone/
├── backend/
│   ├── app.py              # Flask server
│   ├── requirements.txt    # Python dependencies
│   └── .gitignore
│
├── frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
│
└── dataset/
    ├── server_logs.json    # Raw unlabeled logs (775 events)
    ├── server_logs.csv     # Same in CSV format
    ├── ground_truth.json   # Event ID → Attack type mapping
    ├── knowledge_base.json # CVE/CWE/MITRE for RAG retrieval
    └── dataset_stats.json  # Dataset statistics
```

---

## Phase 02: Datasets

### Dataflow Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATASET LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   server_logs.json ──────┐                                              │
│   (775 raw events)       │                                              │
│                          ▼                                              │
│                  ┌───────────────┐      ┌─────────────────┐             │
│                  │   ANOMALY     │      │  ground_truth   │             │
│                  │   DETECTOR    │─────▶│    (labels)     │             │
│                  └───────┬───────┘      │  for validation │             │
│                          │              └─────────────────┘             │
│                          ▼                                              │
│                  ┌───────────────┐      ┌─────────────────┐             │
│                  │     RAG       │◀────▶│ knowledge_base  │             │
│                  │   PIPELINE    │      │ (CVE/CWE/MITRE) │             │
│                  └───────┬───────┘      └─────────────────┘             │
│                          │                                              │
│                          ▼                                              │
│                  ┌───────────────┐                                      │
│                  │   DASHBOARD   │                                      │
│                  │ Top 3 Alerts  │                                      │
│                  │ + Mitigations │                                      │
│                  │ + Citations   │                                      │
│                  └───────────────┘                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dataset Statistics

The dataset contains **775 synthetic server log events** designed for anomaly detection and RAG-based threat intelligence:

| Category | Count | Percentage |
|----------|-------|------------|
| Normal Events | 500 | 64.5% |
| Malicious Events | 275 | 35.5% |

### Attack Types Included

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

#### 1. `server_logs.json` / `server_logs.csv`
Raw, **unlabeled** server logs - input for the anomaly detector.

**Sample Normal Log:**
```json
{
  "event_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "timestamp": "2024-12-01T02:15:32.456789Z",
  "event_type": "HTTP_REQUEST",
  "source_ip": "192.168.1.101",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "endpoint": "/api/dashboard",
  "http_method": "GET",
  "query_params": null,
  "response_code": 200,
  "response_time_ms": 145
}
```

**Sample Attack Log (SQL Injection - hidden in normal format):**
```json
{
  "event_id": "e5f6g7h8-90ab-cdef-1234-567890abcdef",
  "timestamp": "2024-12-01T08:42:15.123456Z",
  "event_type": "HTTP_REQUEST",
  "source_ip": "185.220.101.45",
  "user_agent": "sqlmap/1.7.2#stable",
  "endpoint": "/api/users",
  "http_method": "GET",
  "query_params": "id=' UNION SELECT username,password FROM users --",
  "response_code": 500,
  "response_time_ms": 1250
}
```

#### 2. `ground_truth.json`
Maps event IDs to attack types - used for **validation** and **accuracy testing** of the anomaly detector.

```json
{
  "e5f6g7h8-90ab-cdef-1234-567890abcdef": "SQL_INJECTION",
  "k9l0m1n2-3456-7890-abcd-ef1234567890": "BRUTE_FORCE"
}
```

#### 3. `knowledge_base.json`
Vulnerability knowledge base for **RAG retrieval** - enriches detected threats with CVE/CWE/MITRE context for LLM-generated mitigations.
With knowledge base: LLM gives specific, citable mitigations with real CVE/CWE/MITRE references
This is the "R" in RAG - Retrieval Augmented Generation. The knowledge base is what gets retrieved to augment the LLM's response

```json
{
  "cve_database": {
    "SQL_INJECTION": [
      {"cve_id": "CVE-2023-34362", "description": "MOVEit Transfer SQL Injection", "cvss_score": 9.8},
      {"cve_id": "CVE-2021-44228", "description": "Log4Shell", "cvss_score": 10.0}
    ]
  },
  "cwe_database": {
    "SQL_INJECTION": {"cwe_id": "CWE-89", "name": "SQL Injection"}
  },
  "mitre_attack": {
    "SQL_INJECTION": {"technique_id": "T1190", "technique_name": "Exploit Public-Facing Application"}
  }
}
```

### How the Dataset Was Created

1. **Normal baseline events (500)**: Realistic login, logout, and API requests from internal IPs with standard user agents

2. **Attack events (275)**: Injected with realistic attack patterns:
   - SQL/XSS/Command injection payloads in query parameters
   - Brute force: 30 rapid failed logins from same IP
   - Port scan: 50 connection attempts from same IP
   - DoS: 100 rapid requests within seconds from same IP
   - Path traversal: `../../../etc/passwd` style paths
   - Unauthorized access: Requests to `/admin`, `/.env`, etc.

3. **Realistic characteristics**:
   - External IPs for most attacks (185.x.x.x, 45.x.x.x ranges)
   - Suspicious user agents (sqlmap, Nikto, curl) for some attacks
   - Varied response codes (200, 401, 403, 500) - attacks may succeed or fail
   - Timestamps spread across the dataset with burst patterns

---

## Prerequisites

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)

## Getting Started

### 1. Clone the Repository

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

# Run the Flask server
python app.py
```

> ⚠️ **Note:** Always activate the virtual environment before running the backend.

The backend will start at: **http://127.0.0.1:5000**

### 3. Setup Frontend

Open a **new terminal** and run:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will start at: **http://localhost:5173**

## API Endpoints

| Method | Endpoint       | Description                    |
|--------|----------------|--------------------------------|
| GET    | `/api/alerts`  | Returns list of security alerts |

### Sample Response

```json
[
  {
    "id": 1,
    "type": "SQL Injection",
    "severity": "Critical",
    "mitigation": "Block IP 192.168.1.5"
  }
]
```

## Available Scripts

### Frontend

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Start development server       |
| `npm run build`   | Build for production           |
| `npm run preview` | Preview production build       |
| `npm run lint`    | Run ESLint                     |

### Backend

| Command           | Description                    |
|-------------------|--------------------------------|
| `python app.py`   | Start Flask server (debug mode)|

## Tech Stack

- **Frontend:** React 18, Vite 6
- **Backend:** Flask 3.0, Flask-CORS
- **Styling:** CSS (Dark theme)

## Troubleshooting

### CORS Errors
Make sure the Flask backend is running and CORS is properly configured for `localhost:5173`.


### Port Already in Use
- Backend default: `5000` - Change in `app.py`
- Frontend default: `5173` - Change in `vite.config.js`

---

## Security_Policy_Ingestion PDF

To ensure responsible and secure use of the LLM within the Sentinel-RAG pipeline, a formal security policy document is generated as `Security_Policy_Ingestion.pdf` (see `pdf_genrate.py`).

**Why was this created?**

Modern LLM-based systems require clear boundaries on what data can be ingested, especially in security-sensitive applications. The security policy PDF:

- Defines exactly what material (datasets, knowledge base, telemetry) is authorized for ingestion by the LLM.
- Explicitly lists prohibited data (e.g., ground truth labels, secrets, PII) to prevent data leakage or misuse.
- Documents the scope, definitions, and change control for compliance and auditability.
- Serves as a reference for developers, auditors, and security teams to ensure the LLM only accesses approved information.

**Purpose:**

The purpose of `Security_Policy_Ingestion.pdf` is to provide a transparent, auditable, and enforceable policy for data ingestion, supporting both regulatory compliance and operational security in the RAG pipeline.


---


## Phase 04: PDF Ingestion and text chunking

### What was added?

- Added a new feature in the backend (`pdf_injestion.py`) that lets the system read PDF files and break them into smaller pieces of text.
- You can use the `/api/pdf-ingest` API to send the path of a PDF file, and the backend will read the file, clean up the text, and split it into chunks (small sections) with a little bit of overlap for better understanding.
- The size of each chunk and how much they overlap can be changed if needed.
- The API gives you a quick look at the first few chunks and tells you how many chunks were made, so you can check if it worked well.

### Why was this added?

- To make it easy to bring in (ingest) important documents like security policies or any other PDF files into the system for checking, searching, or using with AI models.
- Breaking the PDF into smaller parts helps the system process, search, and understand the document better, especially if the file is large.
- Overlapping the chunks a little means you don’t lose important context between sections, so answers and summaries are more accurate.
- This also helps with following rules and keeping things clear, because you can easily check and process policy documents.