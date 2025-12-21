from pypdf import PdfReader
import nltk
from nltk.tokenize import sent_tokenize
import re

PDF_PATH = "security_policy.pdf"
CHUNK_SIZE = 500
OVERLAP_SENTENCES = 2


def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    
    for page in reader.pages:
        text += page.extract_text() + " "
    
    return text


def clean_text(text):
    # Remove headers and footers
    text = text.replace("AI Data Ingestion & Security Policy", "")
    text = text.replace("Sentinel-RAG Pipeline | Classification: INTERNAL", "")
    text = re.sub(r"Page \d+/\d+ - Generated: \d{4}-\d{2}-\d{2}", "", text)
    # Clean up spaces
    text = " ".join(text.split())
    
    return text

def chunk_text(text, chunk_size, overlap):
    sentences = sent_tokenize(text)
    chunks = []
    batch = []
    current_len = 0

    for sentence in sentences:
        sentence_len = len(sentence)

        if current_len + sentence_len > chunk_size and batch:
            chunks.append(" ".join(batch))

            batch = batch[-overlap:] if overlap > 0 else []
            current_len = sum(len(s) for s in batch)

        batch.append(sentence)
        current_len += sentence_len

    if batch:
        chunks.append(" ".join(batch))

    return chunks



def run_pdf_ingestion_pipeline(pdf_path=PDF_PATH, chunk_size=CHUNK_SIZE, overlap=OVERLAP_SENTENCES, preview_chunks=3):
    """Main function: read PDF and split into chunks."""
    
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt")
    
    raw_text = extract_text_from_pdf(pdf_path)
    cleaned_text = clean_text(raw_text)
    chunks = chunk_text(cleaned_text, chunk_size, overlap)
    
    preview = []
    for i in range(min(preview_chunks, len(chunks))):
        preview.append({
            "chunk_number": i + 1,
            "text": chunks[i][:300]  
        })
    
    return {
        "total_chunks": len(chunks),
        "preview_chunks": preview,
        "all_chunks": chunks
    }