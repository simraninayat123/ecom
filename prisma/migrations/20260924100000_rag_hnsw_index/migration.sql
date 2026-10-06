CREATE INDEX IF NOT EXISTS "ProductEmbedding_embedding_hnsw_idx" ON "ProductEmbedding" USING hnsw (embedding vector_cosine_ops);
