import { ServiceUnavailableException } from '@nestjs/common';
import { MlClientService } from './ml-client.service';

describe('MlClientService', () => {
  let service: MlClientService;

  beforeEach(() => {
    const config = { get: jest.fn().mockReturnValue('http://ml:8000/') };
    service = new MlClientService(config as never);
  });

  it('should classify text through the ML service', async () => {
    const payload = {
      event_type: 'flood',
      confidence: 0.92,
      probabilities: { flood: 0.92 },
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(payload),
    }) as unknown as typeof fetch;

    await expect(service.classify('heavy rain flooded the streets')).resolves.toEqual(
      {
        eventType: 'flood',
        confidence: 0.92,
        probabilities: { flood: 0.92 },
      },
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'http://ml:8000/classify/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'heavy rain flooded the streets' }),
      }),
    );
  });

  it('should map ML snake_case duplicate fields to camelCase', async () => {
    const payload = {
      is_duplicate: true,
      similar_to_index: 2,
      similarity_score: 0.87,
      duplicate_of: 'flood in the city',
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(payload),
    }) as unknown as typeof fetch;

    const result = await service.detectDuplicates('flood text', ['a', 'b', 'c']);

    expect(result).toEqual({
      isDuplicate: true,
      similarToIndex: 2,
      similarityScore: 0.87,
      duplicateOf: 'flood in the city',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://ml:8000/duplicates/',
      expect.objectContaining({
        body: JSON.stringify({
          text: 'flood text',
          existing_texts: ['a', 'b', 'c'],
          threshold: null,
        }),
      }),
    );
  });

  it('should map camelCase inputs to ML snake_case fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ score: 80, factors: {} }),
    }) as unknown as typeof fetch;

    await service.scoreCredibility({
      text: 'report text',
      source: 'citizen',
      hasMedia: true,
      hasLocation: false,
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      text: 'report text',
      source: 'citizen',
      has_media: true,
      has_location: false,
    });
  });

  it('should throw ServiceUnavailableException when ML service is down', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('connection refused')) as unknown as typeof fetch;

    await expect(service.classify('test')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});