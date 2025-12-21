from flask import Flask, jsonify, request
from pdf_injestion import run_pdf_ingestion_pipeline
from setup_vector_db import setup_qdrant
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])


# Dummy security alerts data
DUMMY_ALERTS = [
    {
        "id": 1,
        "type": "SQL Injection",
        "severity": "Critical",
        "mitigation": "Block IP 192.168.1.5"
    },
    {
        "id": 2,
        "type": "Cross-Site Scripting (XSS)",
        "severity": "High",
        "mitigation": "Sanitize input fields on /login endpoint"
    },
    {
        "id": 3,
        "type": "Brute Force Attack",
        "severity": "Medium",
        "mitigation": "Enable rate limiting on authentication endpoints"
    }
]


@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Return a list of dummy security alerts."""
    return jsonify(DUMMY_ALERTS)

@app.route("/api/pdf-ingest", methods=["POST"])
def pdf_ingest():
    data = request.get_json()
    pdf_path = data.get("pdf_path") if data else None
    if not pdf_path:
        return jsonify({"error": "Missing 'pdf_path' in request body."}), 400
    try:
        result = run_pdf_ingestion_pipeline(pdf_path=pdf_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/setup-vector-db", methods=["POST"])
def setup_vector_db_api():
    """
    Set up the vector database using the ingested PDF chunks.
    Accepts optional JSON: {"pdf_path": ...} to ingest a specific PDF.
    Returns a summary of the operation.
    """
    data = request.get_json()
    pdf_path = data.get("pdf_path") if data else None
    try:
        setup_qdrant(pdf_path=pdf_path)
        return jsonify({"status": "success", "message": "Vector DB setup complete."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
if __name__ == "__main__":
    app.run(debug=True, port=5000)
