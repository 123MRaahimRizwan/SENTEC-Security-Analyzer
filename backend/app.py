from flask import Flask, jsonify, request
from werkzeug.utils import secure_filename
import tempfile
from pdf_injestion import run_pdf_ingestion_pipeline
from flask_cors import CORS
from hugging_face import generate_security_analysis
import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime
import time
from metrics_tracker import metrics_tracker

app = Flask(__name__)
# Allow all origins for development (restrict in production)
CORS(app, 
     origins="*",  # Allow all origins for development
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     expose_headers=["Content-Type"])

# Global variables for anomaly detection model
anomaly_model = None
feature_dict = None
log_df = None

# Global storage for uploaded log analysis results
uploaded_incidents = []
uploaded_threat_intel = []
uploaded_assets = []
uploaded_reports = []
uploaded_alerts = []  # Store alerts from uploaded files only
uploaded_chart_data = []  # Store chart data from uploaded files only
last_upload_summary = None  # Store summary of last upload for persistence

# Ground truth data for accuracy tracking
ground_truth_data = {}  # event_id -> attack_type mapping

# Attack type mapping
ATTACK_TYPE_MAPPING = {
    0: "No_Defect",
    1: "DOS",
    2: "PORT_SCAN",
    3: "BRUTE_FORCE",
    4: "SQL_INJECTION",
    5: "XSS",
    6: "UNAUTHORIZED_ACCESS",
    7: "COMMAND_INJECTION",
    8: "PATH_TRAVERSAL"
}

def initialize_backend():
    """Initialize vector DB and anomaly detection model on startup"""
    global anomaly_model, feature_dict, log_df
    
    print("=" * 60)
    print("Initializing Sentinel-RAG Backend...")
    print("=" * 60)
    
    # Step 1: Setup Vector DB with Security Policy PDF
    print("\n[1/3] Setting up Vector Database...")
    try:
        from setup_vector_db import setup_qdrant, ensure_collection_exists
        # Try multiple possible paths for the PDF
        possible_paths = [
            "Security_Policy_Ingestion.pdf",
            "./Security_Policy_Ingestion.pdf",
            "../Security_Policy_Ingestion.pdf"
        ]
        pdf_path = None
        for path in possible_paths:
            if os.path.exists(path):
                pdf_path = path
                break
        if pdf_path:
            print(f"   Found PDF: {pdf_path}")
            ensure_collection_exists(pdf_path=pdf_path)
            print("   ✓ Vector DB initialized successfully")
        else:
            print(f"   ⚠ Warning: {pdf_path} not found. Vector DB will be created when PDF is available.")
            ensure_collection_exists()
    except Exception as e:
        print(f"   ⚠ Warning: Vector DB setup failed: {str(e)}")
        print("   Continuing without vector DB (RAG features may be limited)")
    
    # Step 2: Load and train anomaly detection model
    print("\n[2/3] Loading anomaly detection model...")
    try:
        from log_feature_pipeline import process_logs
        
        # Try multiple possible paths for the CSV
        possible_csv_paths = [
            "./dataset/server_logs.csv",
            "../dataset/server_logs.csv",
            "dataset/server_logs.csv"
        ]
        csv_path = None
        for path in possible_csv_paths:
            if os.path.exists(path):
                csv_path = path
                break
        
        if csv_path:
            print(f"   Processing logs from: {csv_path}")
            feature_dict = process_logs(csv_path)
            
            tfidf_matrix = feature_dict['tfidf_matrix']
            df = feature_dict['features']
            vectorizer = feature_dict['tfidf_vectorizer']
            
            # Load ground truth labels - try multiple paths
            ground_truth_paths = [
                "./dataset/ground_truth.json",
                "../dataset/ground_truth.json",
                "dataset/ground_truth.json"
            ]
            ground_truth_path = None
            for path in ground_truth_paths:
                if os.path.exists(path):
                    ground_truth_path = path
                    break
            
            if not ground_truth_path:
                raise FileNotFoundError("ground_truth.json not found")
            
            with open(ground_truth_path) as file:
                content = json.load(file)
                keys = list(content.keys())
                values = list(content.values())
                # Store ground truth globally for metrics tracking
                global ground_truth_data
                ground_truth_data = content
            
            # Create labels dataframe and merge
            y_labels = pd.DataFrame({'event_id': keys, 'defect': values})
            df = df.merge(y_labels, on='event_id', how='left')
            
            # Label Encoding
            df['defect'] = df['defect'].fillna('No_Defect')
            mapping = {
                'No_Defect': 0,
                'DOS': 1,
                'PORT_SCAN': 2,
                'BRUTE_FORCE': 3,
                'SQL_INJECTION': 4,
                'XSS': 5,
                'UNAUTHORIZED_ACCESS': 6,
                'COMMAND_INJECTION': 7,
                'PATH_TRAVERSAL': 8
            }
            df['defect'] = df['defect'].map(mapping)
            
            # Prepare features for model
            cols_to_drop = ['event_id', 'defect']
            if 'session_id' in df.columns:
                cols_to_drop.append('session_id')
            
            x = df.drop(columns=cols_to_drop, errors='ignore')
            y = df['defect'].copy()
            
            # Add TF-IDF features
            tfidf_df = pd.DataFrame.sparse.from_spmatrix(tfidf_matrix, columns=vectorizer.get_feature_names_out())
            x = pd.concat([x.reset_index(drop=True), tfidf_df.reset_index(drop=True)], axis=1)
            
            # Calculate contamination from actual anomaly ratio
            outlier_fraction = len(df[df['defect'] != 0]) / len(df)
            
            # Train Isolation Forest
            print(f"   Training Isolation Forest (contamination: {outlier_fraction:.4f})...")
            anomaly_model = IsolationForest(n_estimators=100, contamination=outlier_fraction, random_state=42)
            anomaly_model.fit(x)
            
            # Store processed data
            log_df = df.copy()
            feature_dict['processed_df'] = df
            feature_dict['feature_matrix'] = x
            feature_dict['labels'] = y
            
            print("   ✓ Anomaly detection model trained successfully")
        else:
            print(f"   ⚠ Warning: {csv_path} not found. Anomaly detection will be unavailable.")
    except Exception as e:
        print(f"   ⚠ Warning: Anomaly detection setup failed: {str(e)}")
        print("   Continuing without anomaly detection")
    
    print("\n[3/3] Backend initialization complete!")
    print("=" * 60)
    print("\nBackend is ready. API endpoints are available at http://127.0.0.1:5000")
    print("=" * 60 + "\n")


@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Return a list of security alerts from uploaded files only."""
    global uploaded_alerts
    
    # Only return alerts from uploaded files, not from initial dataset
    return jsonify(uploaded_alerts)

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
        # Import here to avoid pulling heavy transformer deps during app startup
        from setup_vector_db import setup_qdrant
        setup_qdrant(pdf_path=pdf_path)
        return jsonify({"status": "success", "message": "Vector DB setup complete."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route("/api/analyze-alert", methods=["POST"])
def analyze_alert():
    """Analyze an alert using RAG pipeline and LLM"""
    # Track start time for response time metrics
    start_time = time.time()
    
    try:
        data = request.json
        
        # Handle both string and numeric defect codes
        defect = data.get("defect")
        if isinstance(defect, str):
            # Try to map string to code
            reverse_mapping = {v: k for k, v in ATTACK_TYPE_MAPPING.items()}
            defect = reverse_mapping.get(defect.upper(), 0)
        elif defect is None:
            defect = 0
        
        alert_id = data.get("event_id", data.get("id", f"alert_{int(time.time())}"))
        event_id = data.get("event_id", "unknown")
        
        alert_payload = {
            "defect": int(defect),
            "event_id": event_id,
            "source_ip": data.get("source_ip", "unknown"),
            "endpoint": data.get("endpoint", "/"),
            "query_params": data.get("query_params", ""),
            "anomaly_score": data.get("anomaly_score", 0)
        }
        
        # Import RAG orchestration lazily to avoid heavy imports at startup
        from rag_orchestration import format_chunks_for_llm, rag_retrieve
        
        # Retrieve relevant chunks from vector DB
        rag_retrieval = rag_retrieve(alert_payload, top_k=3)
        llm_context = format_chunks_for_llm(rag_retrieval['retrieved_chunks'])
        
        # Generate security analysis using LLM
        # format_chunks_for_llm returns a string, but generate_security_analysis expects List[str]
        result = generate_security_analysis(alert=alert_payload, retrieved_context=[llm_context])
        
        # Track end time
        end_time = time.time()
        
        # Check if result has error
        if "error" in result:
            return jsonify({
                "error": result.get("error"),
                "details": result.get("details", ""),
                "alert_type": ATTACK_TYPE_MAPPING.get(alert_payload["defect"], "Unknown"),
                "severity": "Unknown"
            }), 500
        
        # Extract mitigations - handle both list and string formats
        mitigations = result.get("mitigations", [])
        if isinstance(mitigations, str):
            mitigations = [m.strip() for m in mitigations.split('\n') if m.strip()]
        elif not isinstance(mitigations, list):
            mitigations = []
        
        # Extract CVEs - handle both list and string formats
        cves = result.get("cves", [])
        if isinstance(cves, str):
            cves = [c.strip() for c in cves.split(',') if c.strip()]
        elif not isinstance(cves, list):
            cves = []
        
        # Build citations from retrieved chunks
        citations = []
        for chunk in rag_retrieval.get('retrieved_chunks', []):
            citations.append({
                "source": chunk.get("source", "unknown"),
                "chunk_id": chunk.get("chunk_id"),
                "score": chunk.get("score", 0),
                "text_preview": chunk.get("text", "")[:200]
            })
        
        # Extract predicted severity
        predicted_severity = result.get("severity", "Medium")
        alert_type = result.get("alert_type", ATTACK_TYPE_MAPPING.get(alert_payload["defect"], "Unknown"))
        
        # Get actual severity from ground truth if available
        actual_severity = None
        if event_id in ground_truth_data:
            # Map attack type to expected severity (simplified mapping)
            attack_type_gt = ground_truth_data[event_id]
            severity_mapping = {
                "SQL_INJECTION": "Critical",
                "COMMAND_INJECTION": "Critical",
                "XSS": "High",
                "BRUTE_FORCE": "High",
                "DOS": "High",
                "UNAUTHORIZED_ACCESS": "Medium",
                "PORT_SCAN": "Medium",
                "PATH_TRAVERSAL": "Medium"
            }
            actual_severity = severity_mapping.get(attack_type_gt, "Medium")
        
        # Track metrics
        metrics_tracker.track_alert_analysis(
            alert_id=alert_id,
            predicted_severity=predicted_severity,
            actual_severity=actual_severity,
            alert_type=alert_type,
            event_id=event_id
        )
        
        metrics_tracker.track_mitigation_relevance(
            alert_id=alert_id,
            mitigations=mitigations,
            citations=citations,
            llm_confidence=None  # Could be added to LLM response
        )
        
        metrics_tracker.track_analysis_time(
            alert_id=alert_id,
            start_time=start_time,
            end_time=end_time,
            analysis_type="rag_llm"
        )
        
        return jsonify({
            "alert_type": alert_type,
            "severity": predicted_severity,
            "classification": result.get("classification", "True Positive"),
            "analysis": result.get("analysis", "No analysis available"),
            "mitre_technique": result.get("mitre_technique", ""),
            "cves": cves,
            "cwe": result.get("cwe", ""),
            "mitigations": mitigations,
            "citations": citations,
            "rag_query": rag_retrieval.get("query", ""),
            "attack_type": rag_retrieval.get("attack_type", "")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/api/anomaly-chart-data", methods=["GET"])
def get_anomaly_chart_data():
    """Get anomaly chart data for visualization from uploaded files only"""
    global uploaded_chart_data
    
    # Return chart data with attack lines and time range
    if isinstance(uploaded_chart_data, dict):
        return jsonify(uploaded_chart_data)
    else:
        # Legacy format - convert to new format
        return jsonify({
            "data": uploaded_chart_data if uploaded_chart_data else [],
            "attack_lines": [],
            "time_range": {"min": None, "max": None}
        })

@app.route("/api/rag-search", methods=["POST"])
def rag_search():
    """Search the vector database using a query string"""
    try:
        data = request.json
        query_text = data.get("query", "")
        
        if not query_text:
            return jsonify({"error": "Query text is required"}), 400
        
        from rag_orchestration import search_chunks
        
        # Search for relevant chunks
        chunks = search_chunks(query_text, top_k=5)
        
        return jsonify({
            "query": query_text,
            "results": chunks,
            "total_results": len(chunks)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/upload-logs", methods=["POST"])
def upload_logs():
    """Upload and analyze CSV or JSON log files for anomaly detection"""
    global anomaly_model, feature_dict, uploaded_incidents, uploaded_threat_intel, uploaded_assets, uploaded_reports, uploaded_alerts, uploaded_chart_data, last_upload_summary
    
    try:
        if anomaly_model is None:
            return jsonify({"error": "Anomaly detection model not initialized. Please wait for backend to finish initialization."}), 503
        
        # Debug: Log request info
        print(f"[DEBUG] Upload request received. Files: {list(request.files.keys())}")
        print(f"[DEBUG] Content-Type: {request.content_type}")
        print(f"[DEBUG] Form data keys: {list(request.form.keys())}")
        
        if 'file' not in request.files:
            print("[ERROR] No 'file' key in request.files")
            return jsonify({"error": "No file provided. Make sure the form field is named 'file'."}), 400
        
        file = request.files['file']
        print(f"[DEBUG] File received: {file.filename}, Content-Type: {file.content_type}")
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Check file extension
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        
        print(f"[DEBUG] File extension: {file_ext}")
        
        if file_ext not in ['csv', 'json']:
            return jsonify({
                "error": f"Invalid file type '{file_ext}'. Please upload CSV or JSON files only.",
                "filename": filename
            }), 400
        
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix=f'.{file_ext}') as tmp_file:
            file.save(tmp_file.name)
            temp_path = tmp_file.name
        
        try:
            # Load the uploaded file
            if file_ext == 'csv':
                uploaded_df = pd.read_csv(temp_path)
            else:  # JSON
                with open(temp_path, 'r') as f:
                    json_data = json.load(f)
                    # Handle both array of objects and single object
                    if isinstance(json_data, list):
                        uploaded_df = pd.DataFrame(json_data)
                    else:
                        uploaded_df = pd.DataFrame([json_data])
            
            print(f"[DEBUG] Loaded {len(uploaded_df)} rows from file")
            print(f"[DEBUG] Columns found: {list(uploaded_df.columns)}")
            
            # Check if required columns exist
            required_cols = ['event_id', 'timestamp', 'source_ip']
            missing_cols = [col for col in required_cols if col not in uploaded_df.columns]
            if missing_cols:
                print(f"[ERROR] Missing required columns: {missing_cols}")
                return jsonify({
                    "error": f"Missing required columns: {', '.join(missing_cols)}",
                    "required_columns": required_cols,
                    "found_columns": list(uploaded_df.columns),
                    "hint": "Your CSV/JSON must include: event_id, timestamp, and source_ip columns"
                }), 400
            
            # Process the uploaded file through the feature pipeline
            # Save to temp CSV first, then use existing pipeline
            temp_csv_path = temp_path if file_ext == 'csv' else temp_path.replace('.json', '.csv')
            if file_ext == 'json':
                # Convert JSON to CSV for processing
                uploaded_df.to_csv(temp_csv_path, index=False)
            
            # Use the same pipeline as training
            from log_feature_pipeline import process_logs
            
            # Process uploaded file
            uploaded_feature_dict = process_logs(temp_csv_path if file_ext == 'json' else temp_path)
            processed_df = uploaded_feature_dict['features']
            
            if feature_dict is None:
                return jsonify({"error": "Anomaly detection model not properly initialized"}), 503
            
            # Get training data structure
            x_train = feature_dict['feature_matrix']
            train_cols = list(x_train.columns) if hasattr(x_train, 'columns') else list(range(x_train.shape[1]))
            train_vectorizer = feature_dict['tfidf_vectorizer']
            
            # Prepare features for prediction
            cols_to_drop = ['event_id']
            if 'session_id' in processed_df.columns:
                cols_to_drop.append('session_id')
            
            x_uploaded = processed_df.drop(columns=cols_to_drop, errors='ignore')
            
            # Get TF-IDF features using training vectorizer
            # Need to get query_params from original uploaded data
            query_params_text = uploaded_df["query_params"].fillna("") if 'query_params' in uploaded_df.columns else pd.Series([""] * len(uploaded_df))
            uploaded_tfidf = train_vectorizer.transform(query_params_text)
            uploaded_tfidf_df = pd.DataFrame.sparse.from_spmatrix(uploaded_tfidf, columns=train_vectorizer.get_feature_names_out())
            
            # Combine features
            x_uploaded = pd.concat([x_uploaded.reset_index(drop=True), uploaded_tfidf_df.reset_index(drop=True)], axis=1)
            
            # Align columns with training data
            missing_cols = set(train_cols) - set(x_uploaded.columns)
            extra_cols = set(x_uploaded.columns) - set(train_cols)
            
            # Add missing columns with zeros
            for col in missing_cols:
                x_uploaded[col] = 0
            
            # Remove extra columns and reorder to match training
            x_uploaded = x_uploaded.reindex(columns=train_cols, fill_value=0)
            
            # Convert sparse columns to dense while keeping DataFrame structure
            # This preserves feature names for sklearn and avoids warnings
            x_uploaded_dense = x_uploaded.copy()
            for col in x_uploaded_dense.columns:
                if hasattr(x_uploaded_dense[col], 'sparse'):
                    x_uploaded_dense[col] = x_uploaded_dense[col].sparse.to_dense()
            
            # Pass DataFrame directly to sklearn (it will handle it correctly)
            # This preserves feature names and avoids warnings
            scores = anomaly_model.decision_function(x_uploaded_dense)
            predictions = anomaly_model.predict(x_uploaded_dense)
            
            # Convert predictions: 1 = normal, -1 = anomaly
            is_anomaly = np.where(predictions == 1, 0, 1)
            anomaly_indices = np.where(is_anomaly == 1)[0]
            
            # Format results
            alerts = []
            for idx in anomaly_indices:
                row = processed_df.iloc[idx]
                event_id = row['event_id'] if 'event_id' in row else f"event_{idx}"
                
                # Get original data
                original_row = uploaded_df.iloc[idx] if idx < len(uploaded_df) else {}
                
                # Determine attack type (we don't have ground truth, so infer from features)
                defect_code = 0  # Default to No_Defect
                attack_type = "Unknown_Anomaly"
                
                # Try to infer attack type from features
                if 'has_sql_keywords' in processed_df.columns and processed_df.iloc[idx].get('has_sql_keywords', False):
                    defect_code = 4
                    attack_type = "SQL_INJECTION"
                elif 'has_html_tags' in processed_df.columns and processed_df.iloc[idx].get('has_html_tags', False):
                    defect_code = 5
                    attack_type = "XSS"
                else:
                    # Use anomaly score to determine severity
                    score = float(scores[idx])
                    if score < -0.7:
                        defect_code = 1
                        attack_type = "DOS"
                    elif score < -0.5:
                        defect_code = 2
                        attack_type = "PORT_SCAN"
                    else:
                        defect_code = 6
                        attack_type = "UNAUTHORIZED_ACCESS"
                
                # Determine severity
                score = float(scores[idx])
                if score < -0.7:
                    severity = "Critical"
                elif score < -0.5:
                    severity = "High"
                elif score < -0.3:
                    severity = "Medium"
                else:
                    severity = "Low"
                
                alert = {
                    "id": str(event_id),
                    "title": f"{attack_type} Attack Detected",
                    "description": f"Anomaly detected from {original_row.get('source_ip', 'unknown')} to {original_row.get('endpoint', 'unknown')}",
                    "timestamp": str(original_row.get('timestamp', '')),
                    "severity": severity.lower(),
                    "source": str(original_row.get('source_ip', 'unknown')),
                    "endpoint": str(original_row.get('endpoint', '')),
                    "query_params": str(original_row.get('query_params', '')),
                    "anomaly_score": float(score),
                    "defect": defect_code,
                    "attack_type": attack_type,
                    "uploaded_file": filename
                }
                alerts.append(alert)
            
            # Sort by anomaly score (most negative = most anomalous)
            alerts.sort(key=lambda x: x['anomaly_score'])
            
            # Store alerts and chart data from uploaded file
            # Clear all previous data to show only the current upload
            uploaded_incidents = []
            uploaded_threat_intel = []
            uploaded_assets = []
            uploaded_reports = []
            uploaded_alerts = []
            uploaded_chart_data = []
            last_upload_summary = None
            
            # Store alerts from this upload
            uploaded_alerts = alerts
            
            # Generate chart data from uploaded file
            # Create time-based data points and track individual attacks
            chart_data = []
            attack_lines = []  # Store individual attack timestamps for horizontal lines
            min_time = None
            max_time = None
            
            # First pass: collect all timestamps and find min/max
            timestamps = []
            for idx in range(len(uploaded_df)):
                row = uploaded_df.iloc[idx]
                timestamp = row.get('timestamp', '')
                if timestamp:
                    try:
                        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        timestamps.append((dt, idx))
                        if min_time is None or dt < min_time:
                            min_time = dt
                        if max_time is None or dt > max_time:
                            max_time = dt
                    except:
                        pass
            
            if min_time and max_time:
                # Create time buckets based on dataset range
                time_diff = (max_time - min_time).total_seconds()
                
                # Determine bucket size based on dataset range
                if time_diff < 3600:  # Less than 1 hour - use minutes
                    bucket_size = 60  # 1 minute buckets
                    time_format = "%H:%M"
                elif time_diff < 86400:  # Less than 1 day - use hours
                    bucket_size = 3600  # 1 hour buckets
                    time_format = "%H:00"
                else:  # More than 1 day - use days
                    bucket_size = 86400  # 1 day buckets
                    time_format = "%m/%d"
                
                # Create buckets
                time_buckets = {}
                for dt, idx in timestamps:
                    bucket_key = dt.strftime(time_format)
                    if bucket_key not in time_buckets:
                        time_buckets[bucket_key] = {
                            "time": bucket_key,
                            "baseline": 20,
                            "value": 20,
                            "anomalies": 0,
                            "total_events": 0
                        }
                    time_buckets[bucket_key]["total_events"] += 1
                    
                    # Check if this is an anomaly
                    if idx in anomaly_indices:
                        score = float(scores[idx])
                        time_buckets[bucket_key]["anomalies"] += 1
                        time_buckets[bucket_key]["value"] = max(time_buckets[bucket_key]["value"], abs(score) * 100)
                
                # Create attack lines for time buckets that have anomalies
                for bucket_key, bucket_data in time_buckets.items():
                    if bucket_data["anomalies"] > 0:
                        attack_lines.append({
                            "time": bucket_key,
                            "anomalies": bucket_data["anomalies"],
                            "score": bucket_data["value"]
                        })
                
                # Convert to list and sort
                chart_data = list(time_buckets.values())
                
                # Sort by time (handle different formats)
                if time_format == "%H:%M" or time_format == "%H:00":
                    chart_data.sort(key=lambda x: int(x['time'].split(':')[0]) * 60 + int(x['time'].split(':')[1]) if ':' in x['time'] else 0)
                else:
                    chart_data.sort(key=lambda x: x['time'])
            else:
                # Fallback if no valid timestamps
                chart_data = []
            
            uploaded_chart_data = {
                "data": chart_data,
                "attack_lines": attack_lines,
                "time_range": {
                    "min": min_time.isoformat() if min_time else None,
                    "max": max_time.isoformat() if max_time else None
                }
            }
            
            # Generate incidents from alerts
            # Create incidents from all alerts (prioritize critical/high, but include all)
            new_incidents = []
            for alert in alerts:
                # Create incident for all alerts, not just critical/high
                incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{len(uploaded_incidents) + len(new_incidents) + 1:03d}"
                try:
                    alert_timestamp = alert['timestamp']
                    if alert_timestamp:
                        time_str = datetime.fromisoformat(alert_timestamp.replace('Z', '+00:00')).strftime("%H:%M")
                    else:
                        time_str = datetime.now().strftime("%H:%M")
                except:
                    time_str = datetime.now().strftime("%H:%M")
                
                incident = {
                    "id": incident_id,
                    "title": alert['title'],
                    "description": alert['description'],
                    "createdAt": alert['timestamp'] if alert.get('timestamp') else datetime.now().isoformat(),
                    "severity": alert['severity'],
                    "status": "open",
                    "affectedAssets": 1,  # Can be calculated from unique IPs/endpoints
                    "assignedTo": "Unassigned",
                    "timeline": [
                        {
                            "time": time_str,
                            "action": f"Anomaly detected: {alert['attack_type']}",
                            "actor": "Sentinel AI"
                        }
                    ]
                }
                new_incidents.append(incident)
            
            # Store incidents (already cleared above, so just assign)
            uploaded_incidents = new_incidents
            
            # Generate threat intelligence from alerts (CVEs, MITRE, IOCs)
            new_threat_intel = []
            attack_type_counts = {}
            for alert in alerts:
                attack_type = alert['attack_type']
                if attack_type not in attack_type_counts:
                    attack_type_counts[attack_type] = 0
                attack_type_counts[attack_type] += 1
            
            # Create threat intel entries for all detected attack types (including Unknown_Anomaly)
            for attack_type, count in attack_type_counts.items():
                # Determine threat type
                if "INJECTION" in attack_type or "XSS" in attack_type:
                    threat_type = "tactic"
                elif attack_type == "Unknown_Anomaly":
                    threat_type = "ioc"  # Treat unknown anomalies as IOCs
                elif attack_type in ["DOS", "PORT_SCAN", "BRUTE_FORCE"]:
                    threat_type = "threat_feed"
                else:
                    threat_type = "ioc"
                
                threat_id = f"THREAT-{attack_type}-{datetime.now().strftime('%Y%m%d')}-{len(new_threat_intel) + 1}"
                threat_intel = {
                    "id": threat_id,
                    "type": threat_type,
                    "title": f"{attack_type} Attack Pattern Detected",
                    "description": f"Detected {count} {attack_type} attack(s) in uploaded logs. Requires immediate attention." if attack_type != "Unknown_Anomaly" else f"Detected {count} unknown anomaly/anomalies in uploaded logs. Further investigation recommended.",
                    "severity": "critical" if count > 5 else "high" if count > 2 else "medium",
                    "sources": count,
                    "lastUpdated": datetime.now().isoformat(),
                    "score": min(0.95, 0.7 + (count * 0.05))
                }
                new_threat_intel.append(threat_intel)
            
            # Store threat intel (already cleared above, so just assign)
            uploaded_threat_intel = new_threat_intel
            
            # Generate assets from unique IPs and endpoints
            unique_ips = set()
            unique_endpoints = set()
            ip_vulnerabilities = {}
            
            for _, row in uploaded_df.iterrows():
                source_ip = row.get('source_ip', '')
                endpoint = row.get('endpoint', '')
                if source_ip and source_ip != 'unknown':
                    unique_ips.add(source_ip)
                    if source_ip not in ip_vulnerabilities:
                        ip_vulnerabilities[source_ip] = {"critical": 0, "high": 0, "total": 0}
            
            for alert in alerts:
                ip = alert.get('source', '')
                if ip in ip_vulnerabilities:
                    if alert['severity'] == 'critical':
                        ip_vulnerabilities[ip]['critical'] += 1
                    elif alert['severity'] == 'high':
                        ip_vulnerabilities[ip]['high'] += 1
                    ip_vulnerabilities[ip]['total'] += 1
            
            new_assets = []
            for idx, ip in enumerate(unique_ips):
                vulns = ip_vulnerabilities.get(ip, {"critical": 0, "high": 0, "total": 0})
                asset_id = f"AST-{idx+1:03d}"
                status = "critical" if vulns['critical'] > 0 else "warning" if vulns['high'] > 0 or vulns['total'] > 0 else "healthy"
                asset_type = "server" if ip.startswith(("10.", "192.168.")) else "network"
                
                asset = {
                    "id": asset_id,
                    "name": f"asset-{ip.replace('.', '-')}",
                    "type": asset_type,
                    "status": status,
                    "vulnerabilities": vulns['total'],
                    "lastScanned": datetime.now().isoformat(),
                    "criticalVulns": vulns['critical'],
                    "highVulns": vulns['high'],
                    "ip": ip
                }
                new_assets.append(asset)
            
            # Store assets (already cleared above, so just assign)
            uploaded_assets = new_assets
            
            # Generate security report
            report_id = f"RPT-{datetime.now().strftime('%Y%m%d')}-{len(uploaded_reports) + 1:03d}"
            anomaly_rate = (len(alerts) / len(uploaded_df) * 100) if len(uploaded_df) > 0 else 0
            security_score = max(0, 100 - (anomaly_rate * 2))  # Lower score for higher anomaly rate
            
            report = {
                "id": report_id,
                "title": f"Security Analysis Report - {filename}",
                "type": "security",
                "generatedAt": datetime.now().isoformat(),
                "period": f"Analysis of {filename}",
                "findings": len(alerts),
                "score": int(security_score),
                "trend": "down" if anomaly_rate > 10 else "stable" if anomaly_rate > 5 else "up"
            }
            # Store report (replace previous, already cleared above)
            uploaded_reports = [report]
            
            # Store upload summary for persistence
            upload_summary = {
                "status": "success",
                "filename": filename,
                "total_events": len(uploaded_df),
                "anomalies_detected": len(alerts),
                "alerts": alerts,
                "summary": {
                    "normal_events": len(uploaded_df) - len(alerts),
                    "anomalous_events": len(alerts),
                    "anomaly_rate": f"{(len(alerts) / len(uploaded_df) * 100):.2f}%" if len(uploaded_df) > 0 else "0%"
                },
                "generated": {
                    "incidents": len(new_incidents),
                    "threat_intel": len(new_threat_intel),
                    "assets": len(new_assets),
                    "reports": 1
                }
            }
            last_upload_summary = upload_summary
            
            return jsonify(upload_summary)
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except:
                pass
                
    except pd.errors.EmptyDataError:
        print("[ERROR] Uploaded file is empty")
        return jsonify({"error": "Uploaded file is empty"}), 400
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON format: {str(e)}")
        return jsonify({"error": f"Invalid JSON format: {str(e)}"}), 400
    except KeyError as e:
        print(f"[ERROR] KeyError: {str(e)}")
        return jsonify({"error": f"Missing required field in data: {str(e)}"}), 400
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Exception during file processing: {str(e)}")
        print(f"[ERROR] Traceback:\n{error_trace}")
        return jsonify({
            "error": f"Error processing file: {str(e)}",
            "details": error_trace if app.debug else "Check server logs for details"
        }), 500

@app.route("/api/incidents", methods=["GET"])
def get_incidents():
    """Get all incidents from uploaded log analysis"""
    global uploaded_incidents
    return jsonify(uploaded_incidents)

@app.route("/api/threat-intel", methods=["GET"])
def get_threat_intel():
    """Get threat intelligence from uploaded log analysis"""
    global uploaded_threat_intel
    return jsonify(uploaded_threat_intel)

@app.route("/api/assets", methods=["GET"])
def get_assets():
    """Get assets from uploaded log analysis"""
    global uploaded_assets
    return jsonify(uploaded_assets)

@app.route("/api/reports", methods=["GET"])
def get_reports():
    """Get security reports from uploaded log analysis"""
    global uploaded_reports
    return jsonify(uploaded_reports)

@app.route("/api/last-upload-summary", methods=["GET"])
def get_last_upload_summary():
    """Get summary of the last uploaded file for persistence across page refreshes"""
    global last_upload_summary
    if last_upload_summary:
        return jsonify(last_upload_summary)
    else:
        return jsonify({"status": "no_upload"}), 404

@app.route("/api/clear-all-data", methods=["POST"])
def clear_all_data():
    """Clear all uploaded data (alerts, incidents, threats, assets, reports, charts)"""
    global uploaded_incidents, uploaded_threat_intel, uploaded_assets, uploaded_reports, uploaded_alerts, uploaded_chart_data, last_upload_summary
    
    uploaded_incidents = []
    uploaded_threat_intel = []
    uploaded_assets = []
    uploaded_reports = []
    uploaded_alerts = []
    uploaded_chart_data = []
    last_upload_summary = None
    
    return jsonify({
        "status": "success",
        "message": "All uploaded data has been cleared"
    })

@app.route("/api/reports/<report_id>", methods=["GET"])
def get_report_details(report_id):
    """Get detailed information for a specific report"""
    global uploaded_reports, uploaded_incidents, uploaded_threat_intel, uploaded_assets, feature_dict, anomaly_model, log_df
    
    # Find the report
    report = next((r for r in uploaded_reports if r.get('id') == report_id), None)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    
    # Get related data
    related_incidents = [inc for inc in uploaded_incidents if inc.get('createdAt', '').startswith(report.get('generatedAt', '')[:10])]
    related_threats = uploaded_threat_intel[:5] if len(uploaded_threat_intel) > 0 else []  # Top 5 threats
    related_assets = uploaded_assets[:10] if len(uploaded_assets) > 0 else []  # Top 10 assets
    
    # Get alerts from the upload that generated this report
    # We'll need to track which alerts belong to which report
    # For now, get all recent alerts
    related_alerts = []
    try:
        if feature_dict is not None and anomaly_model is not None and log_df is not None:
            x = feature_dict['feature_matrix']
            x_dense = x.copy()
            for col in x_dense.columns:
                if hasattr(x_dense[col], 'sparse'):
                    x_dense[col] = x_dense[col].sparse.to_dense()
            scores = anomaly_model.decision_function(x_dense)
            predictions = anomaly_model.predict(x_dense)
            is_anomaly = np.where(predictions == 1, 0, 1)
            anomaly_indices = np.where(is_anomaly == 1)[0]
            
            # Load original logs
            original_logs_paths = [
                "./dataset/server_logs.json",
                "../dataset/server_logs.json",
                "dataset/server_logs.json"
            ]
            original_logs_path = None
            for path in original_logs_paths:
                if os.path.exists(path):
                    original_logs_path = path
                    break
            
            if original_logs_path:
                with open(original_logs_path, 'r') as f:
                    original_logs = json.load(f)
                log_map = {log['event_id']: log for log in original_logs}
                
                for idx in anomaly_indices[:20]:  # Top 20 alerts
                    if idx < len(log_df):
                        row = log_df.iloc[idx]
                        event_id = row.get('event_id', f'anomaly_{idx}')
                        log_entry = log_map.get(event_id, {})
                        score = float(scores[idx])
                        
                        alert = {
                            "id": event_id,
                            "title": f"Anomaly Detected",
                            "description": f"Anomaly from {log_entry.get('source_ip', 'unknown')}",
                            "timestamp": log_entry.get('timestamp', ''),
                            "severity": "critical" if score < -0.7 else "high" if score < -0.5 else "medium",
                            "anomaly_score": float(score)
                        }
                        related_alerts.append(alert)
    except Exception as e:
        print(f"Error fetching related alerts: {e}")
        related_alerts = []
    
    return jsonify({
        "report": report,
        "related_incidents": related_incidents,
        "related_threats": related_threats,
        "related_assets": related_assets,
        "related_alerts": related_alerts,
        "summary": {
            "total_incidents": len(related_incidents),
            "total_threats": len(related_threats),
            "total_assets": len(related_assets),
            "total_alerts": len(related_alerts)
        }
    })

@app.route("/api/health", methods=["GET", "OPTIONS"])
def health_check():
    """Health check endpoint"""
    if request.method == "OPTIONS":
        # Handle CORS preflight
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")
        return response
    
    try:
        from setup_vector_db import get_client, COLLECTION_NAME
        client = get_client()
        vector_db_ready = False
        if client:
            try:
                client.get_collection(COLLECTION_NAME)
                vector_db_ready = True
            except:
                pass
    except:
        vector_db_ready = False
    
    response = jsonify({
        "status": "healthy",
        "vector_db_ready": vector_db_ready,
        "anomaly_detection_ready": anomaly_model is not None,
        "message": "Backend is running and ready"
    })
    return response

@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    """Get all performance metrics"""
    try:
        metrics = metrics_tracker.get_all_metrics()
        return jsonify(metrics)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/metrics/mitigation-feedback", methods=["POST"])
def submit_mitigation_feedback():
    """Submit user feedback on mitigation relevance"""
    try:
        data = request.json
        alert_id = data.get("alert_id")
        rating = data.get("rating")  # 1-5 stars
        
        if not alert_id or not rating:
            return jsonify({"error": "alert_id and rating (1-5) are required"}), 400
        
        if not (1 <= rating <= 5):
            return jsonify({"error": "rating must be between 1 and 5"}), 400
        
        # Track user feedback
        metrics_tracker.track_mitigation_relevance(
            alert_id=alert_id,
            mitigations=[],  # Not needed for feedback update
            citations=[],
            user_rating=rating
        )
        
        return jsonify({"status": "success", "message": "Feedback recorded"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/metrics/clear", methods=["POST"])
def clear_metrics():
    """Clear all metrics data"""
    try:
        metrics_tracker.clear_metrics()
        return jsonify({"status": "success", "message": "Metrics cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def root():
    """Root endpoint to verify server is running"""
    return jsonify({
        "message": "Sentinel-RAG Backend API",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "alerts": "/api/alerts",
            "upload": "/api/upload-logs",
            "analyze": "/api/analyze-alert",
            "metrics": "/api/metrics"
        }
    })

if __name__ == "__main__":
    # Initialize backend on startup
    initialize_backend()
    app.run(debug=True, port=5000)
