import os
import json
from groq import Groq
from typing import Dict, List, Any

GROQ_API_KEY = "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"

if not GROQ_API_KEY:
    raise ValueError("Error: GROQ_API_KEY environment variable is not set. Get one at: https://console.groq.com")

client = Groq(api_key=GROQ_API_KEY)

MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.1-70b-versatile")
FALLBACK_MODELS = [m.strip() for m in os.getenv("FALLBACK_MODELS", "llama-3.1-8b-instant,mixtral-8x7b-32768,gemma2-9b-it").split(",") if m.strip()]

SECURITY_ANALYSIS_PROMPT_TEMPLATE = """
You are a senior cybersecurity analyst. Analyze the detected security alert using ONLY the provided context.

ALERT DETAILS:
{alert}

RETRIEVED CONTEXT:
{context}

INSTRUCTIONS:
1. Analyze the relationship between the alert and the context.
2. Determine if this is a True Positive or False Positive based on the context.
3. Assign a severity level.
4. List specific MITRE techniques and CVEs if applicable.

Output MUST be ONLY a valid JSON object (no markdown, no explanation) matching this schema:
{{
  "alert_type": "string",
  "severity": "Low | Medium | High | Critical",
  "classification": "True Positive | False Positive",
  "analysis": "string",
  "mitre_technique": "string",
  "cves": ["string"],
  "mitigations": ["string"]
}}
"""

def generate_security_analysis(alert: Dict, retrieved_context: List[str]) -> Dict[str, Any]:
    """
    Generates security analysis using Groq's API (FREE & FAST).
    """
    context_text = "\n".join(retrieved_context)
    prompt_text = SECURITY_ANALYSIS_PROMPT_TEMPLATE.format(
        alert=json.dumps(alert, indent=2),
        context=context_text
    )

    def _call_model(model_name: str):
        print(f"Calling Groq API with model: {model_name}")
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": "You are a cybersecurity expert. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt_text
                }
            ],
            temperature=0.2,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )

        result_text = response.choices[0].message.content
        # Clean up any markdown formatting if present
        result_text = result_text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        result_text = result_text.strip()
        return result_text

    models_to_try = [MODEL_NAME] + [m for m in FALLBACK_MODELS if m != MODEL_NAME]

    last_exception = None
    last_raw = None
    for model in models_to_try:
        try:
            result_text = _call_model(model)
            return json.loads(result_text)
        except json.JSONDecodeError as e:
            last_exception = e
            last_raw = result_text if 'result_text' in locals() else None
            return {
                "error": "JSON Parse Error",
                "details": str(e),
                "raw_response": last_raw or "N/A",
                "model": model
            }
        except Exception as e:
            msg = str(e)
            last_exception = e
            print(f"Model {model} failed: {msg}")

            if "decommissioned" in msg.lower() or "model_decommissioned" in msg.lower() or "not supported" in msg.lower():
                print(f"Model {model} appears decommissioned. Trying next fallback model if available.")
                continue
            if "404" in msg or "not found" in msg.lower():
                print("Model not found (404). Listing available models to help choose a replacement:")
                try:
                    list_available_models()
                except Exception:
                    pass
                return {
                    "error": "Model Not Found",
                    "details": msg,
                    "model": model
                }
            last_raw = None
            continue

    details = str(last_exception) if last_exception else "No models attempted"
    return {
        "error": "Groq API Error",
        "details": details,
        "raw_response": last_raw or "N/A",
        "tried_models": models_to_try
    }

def list_available_models():
    """
    List available Groq models.
    """
    try:
        models = client.models.list()
        print("Available Groq models:")
        for model in models.data:
            print(f"  - {model.id}")
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    
    sample_alert = {
        "event_id": "EVT-2024-001",
        "detected_type": "SQL Injection Attempt",
        "source_ip": "192.168.1.100",
        "endpoint": "/api/login",
        "timestamp": "2024-12-26T10:30:00Z"
    }
    
    sample_context = [
        "CVE-2024-1234: Critical SQL injection vulnerability in login handler",
        "MITRE T1190: Exploit Public-Facing Application",
        "Previous incidents: 3 SQL injection attempts from this IP range in the last 24 hours"
    ]
    
    print(f"Generating security analysis using Groq ({MODEL_NAME})...")
    print("=" * 60)
    
    result = generate_security_analysis(sample_alert, sample_context)
    
    print("\n--- Analysis Result ---")
    print(json.dumps(result, indent=2))