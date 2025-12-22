"""
RAG Orchestration Module
========================

This module handles the complete RAG (Retrieval Augmented Generation) pipeline:
1. Converts anomaly data into search queries
2. Retrieves relevant chunks from vector database
3. Formats results for LLM context assembly

Step-by-step explanation:
- Anomaly data comes from isolation forest detection
- We convert it to natural language queries
- We search the vector DB for similar policy chunks
- We return top-k chunks with metadata for LLM context
"""

from setup_vector_db import get_client, embedding_model, COLLECTION_NAME
from typing import Dict, List, Any

# ============================================================================
# STEP 1: Attack Type Mapping
# ============================================================================
# This dictionary maps defect codes (numbers) to human-readable attack names
# We need this to convert anomaly codes into meaningful search queries

ATTACK_TYPE_MAPPING = {
    0: "No_Defect",
    1: "DOS",                    # Denial of Service
    2: "PORT_SCAN",              # Port Scanning
    3: "BRUTE_FORCE",            # Brute Force Authentication
    4: "SQL_INJECTION",          # SQL Injection
    5: "XSS",                    # Cross-Site Scripting
    6: "UNAUTHORIZED_ACCESS",    # Unauthorized Access
    7: "COMMAND_INJECTION",       # Command Injection
    8: "PATH_TRAVERSAL"          # Path Traversal
}

# Human-readable descriptions for better query generation
ATTACK_DESCRIPTIONS = {
    "DOS": "denial of service attack",
    "PORT_SCAN": "port scanning attack",
    "BRUTE_FORCE": "brute force authentication attack",
    "SQL_INJECTION": "SQL injection attack",
    "XSS": "cross-site scripting attack",
    "UNAUTHORIZED_ACCESS": "unauthorized access attempt",
    "COMMAND_INJECTION": "command injection attack",
    "PATH_TRAVERSAL": "path traversal attack"
}


# ============================================================================
# STEP 2: Convert Anomaly to Search Query
# ============================================================================
# This function takes anomaly data and converts it into a natural language
# query that we can use to search the vector database

def anomaly_to_query(anomaly_data: Dict[str, Any]) -> str:
    """
    Convert anomaly data into a search query string.
    
    What this does:
    1. Takes anomaly data (dict with defect code, IP, endpoint, etc.)
    2. Extracts the attack type from defect code
    3. Builds a natural language query
    4. Optionally adds context (endpoint, IP, etc.)
    
    Args:
        anomaly_data: Dictionary containing:
            - defect: Attack type code (0-8)
            - source_ip: Source IP address (optional)
            - endpoint: API endpoint (optional)
            - query_params: Query parameters (optional)
            - anomaly_score: Anomaly score (optional)
    
    Returns:
        str: Natural language query string
        
    Example:
        Input: {"defect": 4, "endpoint": "/api/users"}
        Output: "SQL injection attack security policy mitigation"
    """
    
    # Step 2.1: Extract defect code and get attack type name
    defect_code = anomaly_data.get("defect", 0)
    attack_type = ATTACK_TYPE_MAPPING.get(defect_code, "No_Defect")
    
    # Step 2.2: If it's not an attack, return generic query
    if attack_type == "No_Defect" or defect_code == 0:
        return "security policy general guidelines"
    
    # Step 2.3: Get human-readable attack description
    attack_description = ATTACK_DESCRIPTIONS.get(attack_type, attack_type.lower())
    
    # Step 2.4: Build base query with attack type
    # This is the core query that will find relevant policy chunks
    base_query = f"{attack_description} security policy mitigation"
    
    # Step 2.5: Enhance query with context if available
    # This makes the query more specific and likely to find relevant chunks
    
    endpoint = anomaly_data.get("endpoint", "")
    source_ip = anomaly_data.get("source_ip", "")
    query_params = anomaly_data.get("query_params", "")
    
    # Check if endpoint is sensitive (adds context)
    sensitive_endpoints = ["/admin", "/api/users", "/api/database", "/login"]
    if any(ep in endpoint for ep in sensitive_endpoints):
        base_query += f" for {endpoint} endpoint"
    
    # Check if query params contain suspicious patterns (adds context)
    if query_params and any(keyword in str(query_params).lower() 
                           for keyword in ["union", "select", "script", "../"]):
        base_query += " input validation"
    
    # Check if IP is external (adds context)
    if source_ip and not source_ip.startswith(("10.", "192.168.", "172.16.")):
        base_query += " external IP"
    
    return base_query


# ============================================================================
# STEP 3: Retrieve Chunks from Vector Database
# ============================================================================
# This function searches the Qdrant vector database for similar chunks

def search_chunks(query_text: str, top_k: int = 5, score_threshold: float = 0.3) -> List[Dict[str, Any]]:
    """
    Search the vector database for chunks similar to the query.
    
    What this does:
    1. Takes a query string (natural language)
    2. Converts it to an embedding vector using the same model
    3. Searches Qdrant for similar chunks
    4. Returns top-k chunks with their text and metadata
    
    Args:
        query_text: The search query (natural language)
        top_k: Number of top results to return (default: 5)
        score_threshold: Minimum similarity score (0-1, default: 0.3)
                         Lower scores mean less similar
    
    Returns:
        List of dictionaries, each containing:
            - text: The chunk text content
            - score: Similarity score (0-1, higher is better)
            - chunk_id: Unique chunk identifier
            - source: Source file name
            - metadata: Additional metadata from payload
    
    Example:
        Input: "SQL injection attack security policy mitigation"
        Output: [
            {
                "text": "SQL Injection attacks can be prevented by...",
                "score": 0.89,
                "chunk_id": 42,
                "source": "Security_Policy_Ingestion.pdf",
                "metadata": {...}
            },
            ...
        ]
    """
    
    # Step 3.1: Get the Qdrant client (from setup_vector_db)
    client = get_client()
    
    # Step 3.2: Check if client exists and collection is ready
    if client is None:
        raise ValueError("Vector database client not initialized. Run setup_qdrant() first.")
    
    try:
        client.get_collection(COLLECTION_NAME)
    except Exception:
        from setup_vector_db import ensure_collection_exists
        print(f"Collection '{COLLECTION_NAME}' not found. Setting up vector database...")
        ensure_collection_exists()
    
    # Step 3.3: Convert query text to embedding vector
    # This uses the same embedding model that was used to store chunks
    # The embedding is a numerical representation of the text meaning
    query_embedding = embedding_model.encode(query_text).tolist()
    
    # Step 3.4: Search Qdrant for similar chunks
    # Qdrant compares the query embedding with stored chunk embeddings
    # Returns top-k most similar chunks based on cosine similarity
    try:
        search_results = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            limit=top_k  # Get top-k results
        )
    except Exception as e:
        raise ValueError(f"Error searching vector database: {str(e)}")
    
    # Step 3.5: Format results into a clean list of dictionaries
    retrieved_chunks = []
    
    for result in search_results:
        # Extract data from Qdrant result
        score = result.score  # Similarity score (0-1)
        payload = result.payload  # Metadata stored with chunk
        
        # Step 3.6: Filter by score threshold
        # Only include chunks that are similar enough
        if score >= score_threshold:
            chunk_data = {
                "text": payload.get("text", ""),  # The actual chunk text
                "score": float(score),  # Similarity score
                "chunk_id": payload.get("chunk_id", None),  # Chunk ID
                "source": payload.get("source", "unknown"),  # Source file
                "metadata": payload  # All metadata
            }
            retrieved_chunks.append(chunk_data)
    
    # Step 3.7: Return results (already sorted by score, highest first)
    return retrieved_chunks


# ============================================================================
# STEP 4: Main RAG Orchestration Function
# ============================================================================
# This is the main function that orchestrates the entire RAG pipeline

def rag_retrieve(anomaly_data: Dict[str, Any], top_k: int = 5) -> Dict[str, Any]:
    """
    Complete RAG retrieval pipeline: Anomaly → Query → Search → Results
    
    What this does (step by step):
    1. Takes anomaly data from isolation forest detection
    2. Converts anomaly to search query (using anomaly_to_query)
    3. Searches vector database for relevant chunks (using search_chunks)
    4. Formats and returns everything needed for LLM context
    
    Args:
        anomaly_data: Dictionary containing anomaly information:
            - defect: Attack type code (required)
            - event_id: Event identifier (optional)
            - source_ip: Source IP address (optional)
            - endpoint: API endpoint (optional)
            - query_params: Query parameters (optional)
            - anomaly_score: Anomaly score (optional)
            - Any other fields from log data
        top_k: Number of chunks to retrieve (default: 5)
    
    Returns:
        Dictionary containing:
            - query: The generated search query
            - retrieved_chunks: List of top-k chunks with text and metadata
            - anomaly_info: Original anomaly data
            - attack_type: Human-readable attack type name
            - total_chunks: Number of chunks retrieved
    
    Example:
        Input:
        {
            "defect": 4,
            "event_id": "abc123",
            "source_ip": "185.220.101.45",
            "endpoint": "/api/users",
            "query_params": "id=' UNION SELECT...",
            "anomaly_score": -0.85
        }
        
        Output:
        {
            "query": "SQL injection attack security policy mitigation for /api/users endpoint input validation",
            "retrieved_chunks": [
                {
                    "text": "SQL Injection attacks...",
                    "score": 0.89,
                    "chunk_id": 42,
                    "source": "Security_Policy_Ingestion.pdf"
                },
                ...
            ],
            "anomaly_info": {...original data...},
            "attack_type": "SQL_INJECTION",
            "total_chunks": 5
        }
    """
    
    # Step 4.1: Validate input
    # if not isinstance(anomaly_data, dict):
    #     raise ValueError("anomaly_data must be a dictionary")
    
    if "defect" not in anomaly_data:
        raise ValueError("anomaly_data must contain 'defect' field")
    
    # Step 4.2: Convert anomaly to search query
    # This transforms the anomaly data into a natural language query
    search_query = anomaly_to_query(anomaly_data)
    
    # Step 4.3: Get attack type name for reference
    defect_code = anomaly_data.get("defect", 0)
    attack_type = ATTACK_TYPE_MAPPING.get(defect_code, "No_Defect")
    
    # Step 4.4: Search vector database for relevant chunks
    # This finds the most similar policy chunks to our query
    retrieved_chunks = search_chunks(search_query, top_k=top_k)
    
    # Step 4.5: Format the complete response
    # This packages everything needed for the LLM context
    result = {
        "query": search_query,  # The query we used
        "retrieved_chunks": retrieved_chunks,  # The chunks we found
        "anomaly_info": anomaly_data,  # Original anomaly data
        "attack_type": attack_type,  # Human-readable attack type
        "total_chunks": len(retrieved_chunks)  # How many chunks we got
    }
    
    return result


# ============================================================================
# STEP 5: Helper Function - Format Chunks for LLM Context
# ============================================================================
# This function formats retrieved chunks into a single context string
# that can be directly used in LLM prompts

def format_chunks_for_llm(retrieved_chunks: List[Dict[str, Any]], max_length: int = 2000) -> str:
    """
    Format retrieved chunks into a single context string for LLM.
    
    What this does:
    1. Takes list of retrieved chunks
    2. Combines them into a single formatted string
    3. Adds separators and metadata
    4. Truncates if too long
    
    Args:
        retrieved_chunks: List of chunk dictionaries from search_chunks()
        max_length: Maximum length of context string (default: 2000 chars)
    
    Returns:
        Formatted string ready for LLM prompt
        
    Example Output:
        "=== Security Policy Chunk 1 (Score: 0.89) ===
         SQL Injection attacks can be prevented by...
         
         === Security Policy Chunk 2 (Score: 0.85) ===
         Input validation is critical for..."
    """
    
    if not retrieved_chunks:
        return "No relevant security policy chunks found."
    
    formatted_parts = []
    current_length = 0
    
    for idx, chunk in enumerate(retrieved_chunks, 1):
        # Format each chunk with header
        chunk_text = chunk.get("text", "")
        chunk_score = chunk.get("score", 0.0)
        chunk_source = chunk.get("source", "unknown")
        
        # Create formatted chunk
        formatted_chunk = f"\n=== Security Policy Chunk {idx} (Score: {chunk_score:.2f}, Source: {chunk_source}) ===\n{chunk_text}\n"
        
        # Check if adding this chunk would exceed max length
        if current_length + len(formatted_chunk) > max_length:
            break
        
        formatted_parts.append(formatted_chunk)
        current_length += len(formatted_chunk)
    
    # Combine all chunks
    context = "\n".join(formatted_parts)
    
    return context


# ============================================================================
# STEP 6: Example Usage and Testing
# ============================================================================

if __name__ == "__main__":
    """
    Example usage of the RAG orchestration pipeline.
    Run this file directly to test the functions.
    """
    
    # Example 1: SQL Injection anomaly
    print("=" * 60)
    print("Example 1: SQL Injection Anomaly")
    print("=" * 60)
    
    sql_injection_anomaly = {
        "defect": 4,  # SQL_INJECTION
        "event_id": "abc123-def456",
        "source_ip": "185.220.101.45",
        "endpoint": "/api/users",
        "query_params": "id=' UNION SELECT username,password FROM users --",
        "anomaly_score": -0.85
    }
    
    try:
        result = rag_retrieve(sql_injection_anomaly, top_k=3)
        print(f"\nGenerated Query: {result['query']}")
        print(f"\nAttack Type: {result['attack_type']}")
        print(f"\nRetrieved {result['total_chunks']} chunks:")
        
        for i, chunk in enumerate(result['retrieved_chunks'], 1):
            print(f"\n--- Chunk {i} ---")
            print(f"Score: {chunk['score']:.3f}")
            print(f"Text Preview: {chunk['text'][:200]}...")
        
        # Format for LLM
        llm_context = format_chunks_for_llm(result['retrieved_chunks'])
        print(f"\n\n=== LLM Context (first 500 chars) ===")
        print(llm_context[:500])
        
    except Exception as e:
        print(f"Error: {str(e)}")
        print("Make sure to run setup_qdrant() first!")
    
    # Example 2: Brute Force anomaly
    print("\n\n" + "=" * 60)
    print("Example 2: Brute Force Anomaly")
    print("=" * 60)
    
    brute_force_anomaly = {
        "defect": 3,  # BRUTE_FORCE
        "event_id": "xyz789",
        "source_ip": "192.168.1.100",
        "endpoint": "/login",
        "anomaly_score": -0.72
    }
    
    try:
        result = rag_retrieve(brute_force_anomaly, top_k=3)
        print(f"\nGenerated Query: {result['query']}")
        print(f"\nRetrieved {result['total_chunks']} chunks")
        
    except Exception as e:
        print(f"Error: {str(e)}")