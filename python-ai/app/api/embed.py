from fastapi import APIRouter

from app.schemas.embed_request import EmbedRequest
from app.services.embedding_service import EmbeddingService

router = APIRouter()

embedding_service = EmbeddingService()

@router.post("/embed")
def embed(request: EmbedRequest):

    vectors = embedding_service.embed(request.texts)

    return {
        "model": "BAAI/bge-m3",
        "dimensions": 1024,
        "embeddings": vectors
    }