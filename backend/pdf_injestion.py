from pypdf import PdfReader
import nltk
from nltk.tokenize import sent_tokenize
import re

PDF_PATH = "./Security_Policy_Ingestion.pdf"
CHUNK_SIZE = 800       
CHUNK_OVERLAP = 3    


def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""

    for page_num, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            text += f"\n\n--- Page {page_num + 1} ---\n"
            text += page_text

    return text


def clean_text(text):
    text = text.replace("AI Data Ingestion & Security Policy", "")
    text = text.replace("Sentinel-RAG Pipeline | Classification: INTERNAL", "")
    # 2. Remove Footers using Regex (Matches "Page 1/4-Generated: 2025-12-18")
    # [cite: 25, 47, 70, 74]
    text = re.sub(r"Page \d+/\d+-Generated: \d{4}-\d{2}-\d{2}", "", text)
    text = text.replace("\t", " ")
    text = text.replace("\n", " ")
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


def run_pdf_ingestion_pipeline(pdf_path=PDF_PATH, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP, preview_chunks=3):
    
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt")
        
    raw_text = extract_text_from_pdf(pdf_path)
    cleaned_text = clean_text(raw_text)

    chunks = chunk_text(cleaned_text, chunk_size, overlap)

    preview = []
    for i, chunk in enumerate(chunks[:preview_chunks]):
        preview.append({
            "chunk_number": i + 1,
            "text": chunk[:500]
        })

    return {
        "total_chunks": len(chunks),
        "preview_chunks": preview,
        "all_chunks": chunks
    }