# Sentinel-RAG 🛡️

A security alert monitoring system built with React + Vite frontend and Flask backend.

## Project Structure

```
sentec-hackathone/
├── backend/
│   ├── app.py              # Flask server
│   ├── requirements.txt    # Python dependencies
│   └── .gitignore
│
└── frontend/
    ├── public/             # Static assets
    ├── src/
    │   ├── App.jsx         # Main React component
    │   ├── main.jsx        # React entry point
    │   └── index.css       # Global styles
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── .gitignore
```

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