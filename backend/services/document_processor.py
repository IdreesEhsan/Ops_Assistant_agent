import os
from pypdf import PdfReader
from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.embedding_service import get_embedding
from services.db_service import create_document, insert_chunk

# LangChain's recursive splitter – handles paragraphs, newlines, etc.
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", " ", ""]
)

async def parse_and_store(file_path, filename, user_id):
    """
    Extract text from PDF/DOCX, chunk it, embed each chunk, and store in Supabase.
    Returns the document ID.
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext == '.pdf':
        reader = PdfReader(file_path)
        doc_record = create_document(user_id, filename)
        doc_id = doc_record["id"]
        global_idx = 0

        # Process page by page to preserve page numbers in metadata
        for page_num, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text()
            if not page_text:
                continue
            chunks = splitter.split_text(page_text)   # Using LangChain splitter
            for chunk in chunks:
                embedding = get_embedding(chunk)
                metadata = {
                    "chunk_index": global_idx,
                    "page": page_num,
                    "document_id": doc_id,
                    "filename": filename
                }
                insert_chunk(doc_id, global_idx, chunk, embedding, metadata)
                global_idx += 1
        return doc_id

    elif ext == '.docx':
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        chunks = splitter.split_text(text)   # Using LangChain splitter
        doc_record = create_document(user_id, filename)
        doc_id = doc_record["id"]

        for i, chunk in enumerate(chunks):
            embedding = get_embedding(chunk)
            metadata = {
                "chunk_index": i,
                "page": 1,  # DOCX doesn't have reliable page numbers
                "document_id": doc_id,
                "filename": filename
            }
            insert_chunk(doc_id, i, chunk, embedding, metadata)
        return doc_id
    else:
        raise ValueError("Unsupported file type")