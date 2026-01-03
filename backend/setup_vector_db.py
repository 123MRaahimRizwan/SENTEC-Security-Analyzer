from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from sentence_transformers import SentenceTransformer
import atexit
import os

from pdf_injestion import run_pdf_ingestion_pipeline

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
VECTOR_SIZE = embedding_model.get_sentence_embedding_dimension()

COLLECTION_NAME = "sentinel_policy_v1"

# Lazy initialization - client will be created when needed
_client = None

def _get_or_create_client():
    """Get or create Qdrant client (lazy initialization to avoid lock issues)."""
    global _client
    if _client is None:
        # Check if running on Hugging Face Spaces
        is_hf_space = os.getenv("SPACE_ID") is not None
        
        if is_hf_space:
            print("Running on Hugging Face Spaces - using in-memory storage")
            _client = QdrantClient(":memory:")
        else:
            try:
                _client = QdrantClient(path="./qdrant_db")  # Persistent storage
            except RuntimeError as e:
                if "already accessed by another instance" in str(e):
                    print("Warning: Qdrant database is locked by another process.")
                    print("Please close other Python processes using the database, or use in-memory storage.")
                    print("Switching to in-memory storage for this session...")
                    _client = QdrantClient(":memory:")  # Fallback to in-memory
                else:
                    raise
    return _client

def setup_qdrant(pdf_path=None):
    global _client
    client = _get_or_create_client()
    try:
        print("In qdrant creating collection")
        client.recreate_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            )
        )

        print("Running ingestion pipeline")
        if pdf_path:
            ingestion_output = run_pdf_ingestion_pipeline(pdf_path=pdf_path)
            source_name = pdf_path
        else:
            ingestion_output = run_pdf_ingestion_pipeline()
            source_name = "Security_Policy_Ingestion.pdf"

        raw_chunks = ingestion_output["all_chunks"]

        print(f"Prepared {len(raw_chunks)} records.")

        print("Embedding and storing data")

        embeddings = embedding_model.encode(
            raw_chunks,
            batch_size=32,
            show_progress_bar=True
        )

        points = []
        for i, (chunk_text, vector) in enumerate(zip(raw_chunks, embeddings)):
            points.append(
                PointStruct(
                    id=i,
                    vector=vector.tolist(),
                    payload={
                        "text": chunk_text,
                        "chunk_id": i,
                        "source": source_name
                    }
                )
            )

        client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )

        print(f"Stored {len(points)} chunks in Qdrant.")
        return {"status": "success", "chunks_count": len(points)}
    except Exception as e:
        print(f"Error setting up Qdrant: {str(e)}")
        raise

def ensure_collection_exists(pdf_path=None):
    global _client
    client = _get_or_create_client()
    try:
        client.get_collection(COLLECTION_NAME)
        print(f"Collection '{COLLECTION_NAME}' already exists.")
        return True
    except Exception:
        print(f"Collection '{COLLECTION_NAME}' not found. Creating...")
        setup_qdrant(pdf_path=pdf_path)
        return True

def get_client():
    """
    Get the Qdrant client (lazy initialization)
    """
    return _get_or_create_client()

def close_client():
    """Properly close the Qdrant Client"""
    global _client
    if _client is not None:
        try:
            _client.close()
        except Exception:
            pass
        _client = None

atexit.register(close_client)

if __name__ == "__main__":
    try:
        # Import here to avoid circular import issues
        import sys
        import os
        
        # Setup vector database first
        setup_qdrant(pdf_path="Security_Policy_Ingestion.pdf")
        
        # Now import rag_orchestration after setup is complete
        from rag_orchestration import rag_retrieve
        
        anomaly = {
            "defect": 4,
            "source_ip": "185.220.101.45",
            "endpoint": "/api/users",
            "query_params": "id= ' UNION SELECT username,password FROM users --",
            "anomaly_score": -0.85
        }

        result = rag_retrieve(anomaly, top_k=5)
        print(result)
    finally:
        close_client()