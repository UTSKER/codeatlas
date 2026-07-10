CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE repository_embeddings (
    id TEXT PRIMARY KEY,
    repository_id TEXT NOT NULL,
    file_id TEXT,
    symbol_id TEXT,
    chunk_type TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1024) NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_repository_embeddings_repository
ON repository_embeddings(repository_id);

CREATE INDEX idx_repository_embeddings_file
ON repository_embeddings(file_id);

CREATE INDEX idx_repository_embeddings_symbol
ON repository_embeddings(symbol_id);

CREATE INDEX idx_repository_embeddings_vector
ON repository_embeddings
USING hnsw (embedding vector_cosine_ops);
