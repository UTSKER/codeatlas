import gc
import torch

from sentence_transformers import SentenceTransformer


class EmbeddingService:

    def __init__(self):

        print("Loading BGE-M3 model...")

        self.model = SentenceTransformer(
            "BAAI/bge-m3",
            trust_remote_code=True,
            device="mps"
        )

        print("BGE-M3 loaded successfully.")

    def embed(self, texts):

        vectors = self.model.encode(
            texts,

            batch_size=1,

            normalize_embeddings=True,

            convert_to_numpy=True,

            show_progress_bar=False
        )

        gc.collect()

        if torch.backends.mps.is_available():
            torch.mps.empty_cache()

        return vectors.tolist()