import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';

const EMBEDDING_DIMENSION = 384;

@Injectable()
export class EmbeddingService {
  private readonly client: InferenceClient | null;
  private readonly model: string;
  private readonly provider: 'hf-inference';

  constructor(config: ConfigService) {
    const token = config.get<string>('HF_TOKEN');
    this.client = token ? new InferenceClient(token) : null;
    this.model = config.get<string>('HF_EMBEDDING_MODEL') ?? 'BAAI/bge-small-en-v1.5';
    this.provider = (config.get<'hf-inference'>('HF_EMBEDDING_PROVIDER') ?? 'hf-inference');
  }

  async embed(inputs: string[]): Promise<number[][]> {
    if (!this.client) throw new ServiceUnavailableException('Hugging Face embeddings are not configured. Set HF_TOKEN to enable recommendations.');
    if (!inputs.length) return [];
    try {
      const output = await Promise.race([
        this.client.featureExtraction({ model: this.model, provider: this.provider, inputs }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Embedding provider timed out')), 30_000)),
      ]);
      const vectors = this.toVectors(output);
      if (vectors.length !== inputs.length) throw new Error('Embedding provider returned an unexpected batch size');
      return vectors.map((vector) => this.normalizeVector(vector));
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown embedding provider error';
      throw new ServiceUnavailableException(`Hugging Face embeddings unavailable: ${message}`);
    }
  }

  private toVectors(output: (number | number[] | number[][])[]): number[][] {
    if (output.every((value) => typeof value === 'number')) return [output as number[]];
    if (output.every((value) => Array.isArray(value) && value.every((item) => typeof item === 'number'))) return output as number[][];
    if (output.length === 1 && Array.isArray(output[0]) && Array.isArray(output[0][0])) return output[0] as number[][];
    throw new Error('Embedding provider returned an invalid vector shape');
  }

  normalizeVector(vector: number[]) {
    if (vector.length !== EMBEDDING_DIMENSION) throw new Error(`Embedding dimension must be ${EMBEDDING_DIMENSION}`);
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (!Number.isFinite(magnitude) || magnitude === 0) throw new Error('Embedding vector cannot be zero or non-finite');
    return vector.map((value) => value / magnitude);
  }
}