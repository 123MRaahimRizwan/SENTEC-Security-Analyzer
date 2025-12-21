from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from sentence_transformers import SentenceTransformer

from pdf_injestion import run_pdf_ingestion_pipeline

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
VECTOR_SIZE = embedding_model.get_sentence_embedding_dimension()

COLLECTION_NAME = "sentinel_policy_v1"

client = QdrantClient(":memory:") 

def setup_qdrant(pdf_path=None):
    global client

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

    # print("\nTEST: Querying the Database for 'SQL Injection'")

    # query_embedding = embedding_model.encode(
    #     "What are the rules for SQL Injection?"
    # ).tolist()

    # results = client.search(
    #     collection_name=COLLECTION_NAME,
    #     query_vector=query_embedding,
    #     limit=1
    # )

    # if results:
    #     hit = results[0]
    #     print("Result:")
    #     print(f"Text: {hit.payload['text']}")
    #     print(f"Score: {hit.score} (Higher is better)")
    # else:
    #     print("No results found.")

def get_client():
    return client