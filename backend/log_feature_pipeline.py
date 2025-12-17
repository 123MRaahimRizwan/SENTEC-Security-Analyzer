import re
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler


# -----------------------------
# Data Loading
# -----------------------------
def load_data(csv_path: str) -> pd.DataFrame:
    """
    Load server log CSV file
    """
    return pd.read_csv(csv_path)


# -----------------------------
# Data Type Fixing
# -----------------------------
def fix_datatypes(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df['timestamp'] = pd.to_datetime(df['timestamp'])

    df[['response_time_ms', 'dest_port']] = (
        df[['response_time_ms', 'dest_port']]
        .apply(pd.to_numeric, errors='coerce')
    )

    object_cols = [
        'response_code', 'event_id', 'source_ip', 'event_type',
        'user_agent', 'endpoint', 'http_method', 'query_params',
        'username', 'auth_result', 'failure_reason',
        'protocol', 'connection_result'
    ]

    df[object_cols] = df[object_cols].astype(object)

    return df


# -----------------------------
# Query Parameter Features
# -----------------------------
def add_query_features(df: pd.DataFrame):
    df = df.copy()

    df["has_query_params"] = df["query_params"].notna()

    df["num_params"] = df["query_params"].apply(
        lambda x: len(str(x).split("&")) if pd.notna(x) else 0
    )

    df["avg_param_length"] = df["query_params"].apply(
        lambda x: (
            sum(len(p) for p in str(x).split("&")) / len(str(x).split("&"))
            if pd.notna(x) else 0
        )
    )

    df["has_sql_keywords"] = df["query_params"].apply(
        lambda x: bool(re.search(r"(select|union|drop|--)", str(x).lower()))
        if pd.notna(x) else False
    )

    df["has_html_tags"] = df["query_params"].apply(
        lambda x: bool(re.search(r"<.*?>", str(x).lower()))
        if pd.notna(x) else False
    )

    # TF-IDF (kept for ML usage)
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(df["query_params"].fillna(""))

    return df, vectorizer, tfidf_matrix


# -----------------------------
# Network / Identity Features
# -----------------------------
def categorize_port(port):
    if pd.isna(port):
        return "none"
    port = int(port)
    if port < 1024:
        return "well_known"
    elif port < 49152:
        return "registered"
    return "ephemeral"


def add_network_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["has_username"] = df["username"].notna()
    df["has_source_ip"] = df["source_ip"].notna()
    df["has_dest_port"] = df["dest_port"].notna()

    df["port_category"] = df["dest_port"].apply(categorize_port)

    high_risk_ports = {21, 22, 23, 25, 80, 443, 3389}
    df["is_high_risk_port"] = df["dest_port"].apply(
        lambda x: int(x) in high_risk_ports if pd.notna(x) else False
    )

    return df


# -----------------------------
# Temporal Features
# -----------------------------
def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df = df.sort_values(["source_ip", "timestamp"])

    df["time_since_last_event"] = (
        df.groupby("source_ip")["timestamp"]
        .diff()
        .dt.total_seconds()
    )

    df["avg_gap"] = (
        df.groupby("source_ip")["time_since_last_event"]
        .transform(lambda x: x.rolling(5, min_periods=1).mean())
    )

    df["session_id"] = (
        df.groupby("source_ip")["timestamp"]
        .diff()
        .dt.total_seconds()
        .gt(1800)
        .cumsum()
    )

    df["events_per_session"] = (
        df.groupby(["source_ip", "session_id"])["event_id"]
        .transform("count")
    )

    df["session_length"] = (
        df.groupby(["source_ip", "session_id"])["timestamp"]
        .transform(lambda x: (x.max() - x.min()).total_seconds())
    )

    return df


# -----------------------------
# Missing Value Handling
# -----------------------------
def fill_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df[df.select_dtypes("object").columns] = (
        df.select_dtypes("object").fillna("None")
    )

    df[df.select_dtypes("number").columns] = (
        df.select_dtypes("number").fillna(0)
    )

    return df


# -----------------------------
# Feature Scaling & Encoding
# -----------------------------
def scale_and_encode(df: pd.DataFrame):
    df = df.copy()

    # Drop columns not used for ML
    df = df.drop(
        columns=['event_id', 'source_ip', 'query_params', 'dest_port', 'username'],
        errors='ignore'
    )

    # Scaling
    num_cols = df.select_dtypes(include='number').columns
    scaler = StandardScaler()
    df[num_cols] = scaler.fit_transform(df[num_cols])

    # One-hot encoding
    df = pd.get_dummies(df, columns=df.select_dtypes(include="object").columns)

    return df, scaler


# -----------------------------
# Full Pipeline (Flask Callable)
# -----------------------------
def process_logs(csv_path: str):
    """
    Main pipeline function to be called from Flask
    """
    df = load_data(csv_path)
    df = fix_datatypes(df)
    df, vectorizer, tfidf_matrix = add_query_features(df)
    df = add_network_features(df)
    df = add_temporal_features(df)
    df = fill_missing_values(df)
    df, scaler = scale_and_encode(df)

    return {
        "features": df,
        "scaler": scaler,
        "tfidf_vectorizer": vectorizer,
        "tfidf_matrix": tfidf_matrix
    }