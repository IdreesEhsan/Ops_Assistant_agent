from sentence_transformers import SentenceTransformer
from functools import lru_cache

# Load the local embedding model once (384 dimensions)
model = SentenceTransformer('all-MiniLM-L6-v2')

@lru_cache(maxsize=128)
def get_embedding(text: str) -> list[float]:
    """
    Return the embedding vector for a given text.
    Caches results to avoid recomputing identical queries.
    """
    return model.encode(text).tolist()