from typing import Dict, List
import json

from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
from langchain_core.prompts import PromptTemplate
from langchain_huggingface import HuggingFaceEndpoint


MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"

MAX_TOKENS = 512
TEMPERATURE = 0.2

llm = HuggingFaceEndpoint(
    repo_id="mistralai/Mistral-7B-Instruct-v0.2",
    huggingfacehub_api_token='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',
    max_new_tokens=512,
    temperature=0.2
)

SECURITY_ANALYSIS_PROMPT = PromptTemplate(
    input_variables=["alert", "context"],
    template="""
You are a senior cybersecurity analyst.

Analyze the detected security alert using ONLY the provided context.

ALERT DETAILS:
{alert}

RETRIEVED CONTEXT (CVE / CWE / MITRE / Security Policy):
{context}

RULES:
- Do NOT invent vulnerabilities or references
- Use only the supplied context
- Cite CVE, CWE, and MITRE IDs explicitly
- Follow security policy constraints if present
- Output MUST be valid JSON

OUTPUT FORMAT:
{{
  "alert_type": "...",
  "severity": "Low | Medium | High | Critical",
  "analysis": "...",
  "mitre_technique": "...",
  "cves": ["CVE-XXXX-XXXX"],
  "cwe": "CWE-XX",
  "mitigations": [
    "...",
    "..."
  ],
  "citations": [
    "CVE-XXXX-XXXX",
    "CWE-XX",
    "MITRE-TXXXX"
  ]
}}
"""
)

def generate_security_analysis(
    alert: Dict,
    retrieved_context: List[str]
) -> Dict:

    context_text = "\n\n".join(retrieved_context)

    prompt = SECURITY_ANALYSIS_PROMPT.format(
        alert=json.dumps(alert, indent=2),
        context=context_text
    )

    raw_response = llm.invoke(prompt)

    try:
        # Extract JSON safely
        response_text = raw_response.strip()
        parsed_response = json.loads(response_text)
        return parsed_response

    except json.JSONDecodeError:
        return {
            "error": "LLM output was not valid JSON",
            "raw_response": raw_response
        }

def build_alert_payload(
    event_id: str,
    detected_type: str,
    source_ip: str,
    endpoint: str
) -> Dict:
    """
    Normalizes alert data before sending to the LLM.
    """
    return {
        "event_id": event_id,
        "detected_type": detected_type,
        "source_ip": source_ip,
        "endpoint": endpoint
    }