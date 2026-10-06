import { registerAs } from '@nestjs/config';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { validateConfig } from '../../utils/validate-config.js';
import type { RagConfig } from './rag-config.type.js';

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsString()
  HF_TOKEN?: string;

  @IsOptional()
  @IsString()
  HF_EMBEDDING_MODEL?: string;

  @IsOptional()
  @IsIn(['hf-inference'])
  HF_EMBEDDING_PROVIDER?: 'hf-inference';

  @IsOptional()
  @IsInt()
  @Min(1)
  RAG_INDEXING_INTERVAL_MS?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  RAG_RETRIEVAL_LIMIT?: number;

  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Max(1)
  RAG_MIN_SIMILARITY?: number;

  @IsOptional()
  @IsString()
  OPENROUTER_API_KEY?: string;

  @IsOptional()
  @IsString()
  OPENROUTER_MODEL?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  OPENROUTER_TIMEOUT_MS?: number;
}

const DEFAULT_GENERATION_MODELS =
  'openai/gpt-4.1-mini,google/gemini-2.5-flash,openai/gpt-4.1-nano';

export default registerAs<RagConfig>('rag', () => {
  const env = validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    embedding: {
      token: env.HF_TOKEN || null,
      model: env.HF_EMBEDDING_MODEL || 'BAAI/bge-small-en-v1.5',
      provider: env.HF_EMBEDDING_PROVIDER ?? 'hf-inference',
    },
    indexing: {
      intervalMs: env.RAG_INDEXING_INTERVAL_MS ?? 5000,
    },
    retrieval: {
      limit: env.RAG_RETRIEVAL_LIMIT ?? 5,
      minSimilarity: env.RAG_MIN_SIMILARITY ?? 0.35,
    },
    generation: {
      apiKey: env.OPENROUTER_API_KEY || null,
      models: (env.OPENROUTER_MODEL || DEFAULT_GENERATION_MODELS)
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean),
      timeoutMs: env.OPENROUTER_TIMEOUT_MS ?? 20000,
    },
  };
});
