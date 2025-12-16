import { useState, useEffect } from "react";

function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/alerts")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch alerts");
        }
        return response.json();
      })
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <h1>Sentinel-RAG</h1>
        <p>Loading alerts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h1>Sentinel-RAG</h1>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Sentinel-RAG</h1>
      <h2>Security Alerts</h2>
      <div style={styles.alertList}>
        {alerts.map((alert) => (
          <div key={alert.id} style={styles.card}>
            <h3>{alert.type}</h3>
            <p>
              <strong>Severity:</strong>{" "}
              <span style={getSeverityStyle(alert.severity)}>
                {alert.severity}
              </span>
            </p>
            <p>
              <strong>Mitigation:</strong> {alert.mitigation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple inline styles (dark theme)
const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  alertList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "20px",
    backgroundColor: "#1a1a1a",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
  },
};

// Helper function for severity colors
function getSeverityStyle(severity) {
  const colors = {
    Critical: { color: "#d32f2f", fontWeight: "bold" },
    High: { color: "#f57c00", fontWeight: "bold" },
    Medium: { color: "#fbc02d", fontWeight: "bold" },
    Low: { color: "#388e3c", fontWeight: "bold" },
  };
  return colors[severity] || {};
}

export default App;
