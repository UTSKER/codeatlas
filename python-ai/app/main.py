from fastapi import FastAPI

from app.api.embed import router as embed_router

app = FastAPI(title="CodeAtlas AI")

app.include_router(embed_router)

@app.get("/health")
def health():
    return {
        "status": "ok"
    }