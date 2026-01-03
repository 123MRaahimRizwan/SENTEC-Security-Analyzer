import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import uuid
import random

# Configuration for cooler graph patterns
START_DATE = datetime(2024, 12, 1, 0, 0, 0)
DURATION_DAYS = 20
EVENTS_PER_HOUR = 50  # More events for smoother graph

# Attack patterns for dramatic visualization
ATTACK_SCENARIOS = [
    # Day 3: SQL Injection burst
    {"start_hour": 3 * 24 + 14, "duration_hours": 2, "intensity": 0.8, "type": "SQL_INJECTION"},
    # Day 5: DDoS attack
    {"start_hour": 5 * 24 + 9, "duration_hours": 4, "intensity": 0.9, "type": "DOS"},
    # Day 8: Port scan
    {"start_hour": 8 * 24 + 3, "duration_hours": 1, "intensity": 0.6, "type": "PORT_SCAN"},
    # Day 10: Brute force attack
    {"start_hour": 10 * 24 + 20, "duration_hours": 3, "intensity": 0.7, "type": "BRUTE_FORCE"},
    # Day 12: XSS attempts
    {"start_hour": 12 * 24 + 16, "duration_hours": 2, "intensity": 0.65, "type": "XSS"},
    # Day 15: Combined attack (multiple types)
    {"start_hour": 15 * 24 + 11, "duration_hours": 5, "intensity": 0.85, "type": "MULTI"},
    # Day 18: Another SQL injection
    {"start_hour": 18 * 24 + 7, "duration_hours": 1, "intensity": 0.75, "type": "SQL_INJECTION"},
]

# IP pools
INTERNAL_IPS = [f"192.168.1.{i}" for i in range(100, 110)] + [f"10.0.0.{i}" for i in range(50, 60)] + [f"172.16.0.{i}" for i in range(10, 20)]
SUSPICIOUS_IPS = ["185.220.101.45", "89.248.167.131", "5.188.206.13", "45.155.205.233", "23.129.64.100", 
                  "193.32.162.159", "195.54.160.149", "209.141.47.245", "185.156.73.54"]

# Endpoints
NORMAL_ENDPOINTS = ["/api/users", "/api/products", "/api/orders", "/home", "/docs", "/help", "/contact", "/api/search", "/api/analytics"]
ATTACK_ENDPOINTS = {
    "SQL_INJECTION": ["/login' OR '1'='1", "/api/users?id=1' UNION SELECT * FROM users--", "/search?q=' DROP TABLE users--"],
    "XSS": ["/search?q=<script>alert('xss')</script>", "/comment?text=<img src=x onerror=alert(1)>"],
    "PATH_TRAVERSAL": ["/../../../etc/passwd", "/files?path=../../config"],
    "COMMAND_INJECTION": ["/api/ping?host=;cat /etc/passwd", "/execute?cmd=whoami"],
}

# User agents
NORMAL_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
]
ATTACK_AGENTS = ["sqlmap/1.7.2", "Nikto/2.5.0", "gobuster/3.5", "masscan/1.3.2", "python-requests/2.28.1"]

USERNAMES = ["john.doe", "sarah.johnson", "michael.harris", "emily.davis", "chris.miller", 
             "amanda.taylor", "nicole.clark", "andrew.rodriguez", "stephanie.lewis", "robert.anderson"]

def is_attack_period(hour):
    """Check if current hour is during an attack scenario"""
    for scenario in ATTACK_SCENARIOS:
        if scenario["start_hour"] <= hour < scenario["start_hour"] + scenario["duration_hours"]:
            return scenario
    return None

def generate_event(timestamp, hour_index, is_attack_scenario=None):
    """Generate a single log event"""
    event_id = str(uuid.uuid4())
    
    # Determine if this is an anomalous event
    if is_attack_scenario:
        is_anomaly = random.random() < is_attack_scenario["intensity"]
    else:
        # Baseline noise: 5% anomaly rate during normal periods
        is_anomaly = random.random() < 0.05
    
    event_type = random.choice(["HTTP_REQUEST", "AUTH_ATTEMPT", "CONNECTION_ATTEMPT"])
    
    if is_anomaly:
        source_ip = random.choice(SUSPICIOUS_IPS) if random.random() > 0.3 else random.choice(INTERNAL_IPS)
        
        if is_attack_scenario:
            attack_type = is_attack_scenario["type"]
            if attack_type == "SQL_INJECTION":
                endpoint = "/login"
                query_params = "id=1' OR '1'='1-- OR username=' UNION SELECT * FROM users--"
                user_agent = random.choice(ATTACK_AGENTS)
            elif attack_type == "XSS":
                endpoint = "/search"
                query_params = "q=<script>alert('xss')</script>&name=<img src=x onerror=alert(1)>"
                user_agent = random.choice(ATTACK_AGENTS)
            elif attack_type == "DOS":
                endpoint = random.choice(NORMAL_ENDPOINTS)
                query_params = ""
                user_agent = random.choice(ATTACK_AGENTS)
            elif attack_type == "PORT_SCAN":
                event_type = "CONNECTION_ATTEMPT"
                endpoint = ""
                query_params = ""
                user_agent = ""
            elif attack_type == "BRUTE_FORCE":
                event_type = "AUTH_ATTEMPT"
                endpoint = "/login"
                query_params = ""
                user_agent = random.choice(ATTACK_AGENTS)
            elif attack_type == "MULTI":
                # Random attack type
                endpoint = random.choice(list(ATTACK_ENDPOINTS.values()))[0] if random.random() > 0.5 else random.choice(NORMAL_ENDPOINTS)
                query_params = ""
                user_agent = random.choice(ATTACK_AGENTS)
        else:
            endpoint = random.choice(NORMAL_ENDPOINTS)
            query_params = ""
            user_agent = random.choice(ATTACK_AGENTS)
    else:
        # Normal traffic
        source_ip = random.choice(INTERNAL_IPS)
        endpoint = random.choice(NORMAL_ENDPOINTS)
        query_params = ""
        user_agent = random.choice(NORMAL_AGENTS)
    
    # Build event
    event = {
        "event_id": event_id,
        "timestamp": timestamp.isoformat() + "Z",
        "event_type": event_type,
        "source_ip": source_ip,
        "user_agent": user_agent if event_type in ["HTTP_REQUEST", "AUTH_ATTEMPT"] else "",
        "endpoint": endpoint if event_type in ["HTTP_REQUEST", "AUTH_ATTEMPT"] else "",
        "http_method": random.choice(["GET", "POST"]) if event_type == "HTTP_REQUEST" else "",
        "query_params": query_params,
        "username": random.choice(USERNAMES) if event_type == "AUTH_ATTEMPT" else "",
        "auth_result": random.choice(["SUCCESS", "FAILED", "LOGOUT"]) if event_type == "AUTH_ATTEMPT" else "",
        "failure_reason": random.choice(["invalid_password", "invalid_credentials", "account_not_found", ""]) if event_type == "AUTH_ATTEMPT" and random.random() > 0.5 else "",
        "dest_port": random.randint(1024, 65535) if event_type == "CONNECTION_ATTEMPT" else "",
        "protocol": random.choice(["TCP", "UDP"]) if event_type == "CONNECTION_ATTEMPT" else "",
        "connection_result": random.choice(["OPEN", "REFUSED", "TIMEOUT", "RESET"]) if event_type == "CONNECTION_ATTEMPT" else "",
        "response_code": random.choice([200, 201, 204, 401, 403, 500]) if event_type == "HTTP_REQUEST" else (200 if event_type == "AUTH_ATTEMPT" and random.random() > 0.3 else 401),
        "response_time_ms": random.randint(10, 2000) if event_type in ["HTTP_REQUEST", "AUTH_ATTEMPT"] else "",
    }
    
    return event

def main():
    print("Generating enhanced synthetic server logs...")
    
    events = []
    total_hours = DURATION_DAYS * 24
    
    for hour in range(total_hours):
        # Check if this hour is part of an attack scenario
        attack_scenario = is_attack_period(hour)
        
        # Vary events per hour (more during attacks, less during quiet periods)
        if attack_scenario:
            events_this_hour = int(EVENTS_PER_HOUR * (1 + attack_scenario["intensity"]))
        else:
            # Add some natural variation to normal traffic
            events_this_hour = int(EVENTS_PER_HOUR * random.uniform(0.7, 1.2))
        
        for _ in range(events_this_hour):
            # Random timestamp within this hour
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            microsecond = random.randint(0, 999999)
            timestamp = START_DATE + timedelta(hours=hour, minutes=minute, seconds=second, microseconds=microsecond)
            
            event = generate_event(timestamp, hour, attack_scenario)
            events.append(event)
    
    # Convert to DataFrame and sort by timestamp
    df = pd.DataFrame(events)
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    print(f"Generated {len(df)} events")
    print(f"Attack scenarios: {len(ATTACK_SCENARIOS)}")
    print(f"Date range: {df['timestamp'].iloc[0]} to {df['timestamp'].iloc[-1]}")
    
    # Save to CSV (both files for compatibility)
    output_path = "dataset/synthetic_server_logs.csv"
    df.to_csv(output_path, index=False)
    print(f"Saved to {output_path}")
    
    # Also save as the main training file
    training_path = "dataset/server_logs.csv"
    df.to_csv(training_path, index=False)
    print(f"Also saved to {training_path} (training data)")
    
    # Print statistics
    print("\nDataset Statistics:")
    print(f"Total events: {len(df)}")
    print(f"Events per day (avg): {len(df) / DURATION_DAYS:.0f}")
    print(f"Event types:")
    print(df['event_type'].value_counts())

if __name__ == "__main__":
    main()
