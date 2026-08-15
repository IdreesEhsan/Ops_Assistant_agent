from sentence_transformers import SentenceTransformer

# Load the local embedding model once (384 dimensions)
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> list[float]:
    """Return the embedding vector for a given text."""
    return model.encode(text).tolist()