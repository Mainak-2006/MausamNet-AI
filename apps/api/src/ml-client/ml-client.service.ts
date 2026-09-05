import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ClassificationResponse {
  eventType: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface CredibilityResponse {
  score: number;
  factors: Record<string, number>;
}

export interface DuplicateResponse {
  isDuplicate: boolean;
  similarToIndex: number | null;
  similarityScore: number;
  duplicateOf: string | null;
}

export interface ScoreCredibilityInput {
  text: string;
  source: string;
  hasMedia?: boolean;
  hasLocation?: boolean;
}

@Injectable()
export class MlClientService {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService
      .get<string>('ML_SERVICE_URL', 'http://localhost:8000')
      .replace(/\/$/, '');
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new ServiceUnavailableException(
        `ML service unreachable at ${this.baseUrl}`,
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `ML service returned status ${response.status}`,
      );
    }

    return response.json() as Promise<T>;
  }

  async classify(text: string): Promise<ClassificationResponse> {
    const data = await this.post<Record<string, unknown>>('/classify/', { text });

    return {
      eventType: String(data.event_type),
      confidence: Number(data.confidence),
      probabilities: (data.probabilities ?? {}) as Record<string, number>,
    };
  }

  async scoreCredibility(
    input: ScoreCredibilityInput,
  ): Promise<CredibilityResponse> {
    return this.post<CredibilityResponse>('/credibility/', {
      text: input.text,
      source: input.source,
      has_media: input.hasMedia ?? false,
      has_location: input.hasLocation ?? true,
    });
  }

  async detectDuplicates(
    text: string,
    existingTexts: string[],
    threshold?: number,
  ): Promise<DuplicateResponse> {
    const data = await this.post<Record<string, unknown>>('/duplicates/', {
      text,
      existing_texts: existingTexts,
      threshold: threshold ?? null,
    });

    return {
      isDuplicate: Boolean(data.is_duplicate),
      similarToIndex:
        data.similar_to_index === null || data.similar_to_index === undefined
          ? null
          : Number(data.similar_to_index),
      similarityScore: Number(data.similarity_score),
      duplicateOf:
        data.duplicate_of === null || data.duplicate_of === undefined
          ? null
          : String(data.duplicate_of),
    };
  }
}