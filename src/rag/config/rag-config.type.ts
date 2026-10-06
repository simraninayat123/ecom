export type RagConfig = {
  embedding: {
    token: string | null;
    model: string;
    provider: 'hf-inference';
  };
  indexing: {
    intervalMs: number;
  };
  retrieval: {
    limit: number;
    minSimilarity: number;
  };
  generation: {
    apiKey: string | null;
    models: string[];
    timeoutMs: number;
  };
};
