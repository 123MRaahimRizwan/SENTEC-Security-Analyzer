from flask import Flask, jsonify
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
