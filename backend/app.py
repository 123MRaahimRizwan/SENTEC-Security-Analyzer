from flask import Flask, jsonify, request
from pdf_injestion import run_pdf_ingestion_pipeline
from setup_vector_db import setup_qdrant
from flask_cors import CORS
from hugging_face import generate_security_analysis
from rag_orchestration import format_chunks_for_llm, rag_retrieve

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
    
@app.route("/api/analyze-alert", methods=["POST"])
def analyze_alert():
    data = request.json

    alert_payload = {
        "defect": data["defect"],
        "event_id": data["event_id"],
        "source_ip": data["source_ip"],
        "endpoint": data["endpoint"],
        "query_params": data["query_params"],
        "anomaly_score": data["anomaly_score"]
    }
    rag_retrieval = rag_retrieve(alert_payload, top_k=3)
    llm_context = format_chunks_for_llm(rag_retrieval['retrieved_chunks'])

    result = generate_security_analysis(alert=alert_payload, retrieved_context=llm_context)

    return jsonify({
    "alert_type": result["result"].get("alert_type"),
    "severity": result["result"].get("severity"),
    "analysis": result["result"].get("analysis"),
    "mitre_technique": result["result"].get("mitre_technique"),
    "cves": result["result"].get("cves", []),
    "cwe": result["result"].get("cwe"),
    "mitigations": result["result"].get("mitigations", []),
    "citations": result["result"].get("citations", []),
    "sources": [doc.metadata for doc in result["source_documents"]]
})



if __name__ == "__main__":
    app.run(debug=True, port=5000)
