/*
  Warnings:

  - You are about to drop the `repository_embeddings` table. If the table is not empty, all the data it contains will be lost.
*/

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop old table
DROP TABLE IF EXISTS "repository_embeddings";

-- =====================================================
-- Code Embeddings
-- =====================================================

CREATE TABLE "CodeEmbedding" (

    -- Primary Key
    "id" TEXT NOT NULL,

    -- Repository Metadata
    "repositoryId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "symbolId" TEXT NOT NULL,

    -- Search Metadata
    "symbolName" TEXT NOT NULL,
    "symbolKind" "SymbolKind" NOT NULL,
    "filePath" TEXT NOT NULL,

    -- Chunk Information
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,

    -- Original Text Used For Embedding
    "content" TEXT NOT NULL,

    -- BGE-M3 Embedding (1024 Dimensions)
    "embedding" vector(1024) NOT NULL,

    -- Timestamp
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeEmbedding_pkey"
        PRIMARY KEY ("id")
);

-- =====================================================
-- Indexes
-- =====================================================

-- Fast Repository Filtering
CREATE INDEX "CodeEmbedding_repositoryId_idx"
ON "CodeEmbedding"("repositoryId");

-- Exact Symbol Lookup
CREATE INDEX "CodeEmbedding_symbolId_idx"
ON "CodeEmbedding"("symbolId");

-- Exact Symbol Name Search
CREATE INDEX "CodeEmbedding_symbolName_idx"
ON "CodeEmbedding"("symbolName");

-- Fast File Lookup
CREATE INDEX "CodeEmbedding_filePath_idx"
ON "CodeEmbedding"("filePath");

-- =====================================================
-- Vector Similarity Index (HNSW)
-- =====================================================

CREATE INDEX "CodeEmbedding_embedding_hnsw_idx"
ON "CodeEmbedding"
USING hnsw ("embedding" vector_cosine_ops);

-- =====================================================
-- Foreign Keys
-- =====================================================

ALTER TABLE "CodeEmbedding"
ADD CONSTRAINT "CodeEmbedding_repositoryId_fkey"
FOREIGN KEY ("repositoryId")
REFERENCES "Repository"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "CodeEmbedding"
ADD CONSTRAINT "CodeEmbedding_fileId_fkey"
FOREIGN KEY ("fileId")
REFERENCES "File"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "CodeEmbedding"
ADD CONSTRAINT "CodeEmbedding_symbolId_fkey"
FOREIGN KEY ("symbolId")
REFERENCES "Symbol"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;