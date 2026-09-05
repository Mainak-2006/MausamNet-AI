import { CredibilityService } from './credibility.service';
import { MlClientService } from '../ml-client/ml-client.service';
import { ReportSource } from '@mausamnet/shared';

describe('CredibilityService', () => {
  let service: CredibilityService;
  const reportRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const mlClient = {
    scoreCredibility: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CredibilityService(
      mlClient as unknown as MlClientService,
      reportRepository as never,
    );
  });

  it('should return the ML score and persist it on the report', async () => {
    mlClient.scoreCredibility.mockResolvedValue({
      score: 72.5,
      factors: { text_length: 20 },
    });
    reportRepository.findOne.mockResolvedValue({
      id: 'report-1',
      credibilityScore: 0,
    });

    const result = await service.score({
      text: 'heavy rain with 30 km/hr winds',
      source: ReportSource.CITIZEN,
      reportId: 'report-1',
    });

    expect(result.score).toBe(72.5);
    expect(reportRepository.save).toHaveBeenCalledWith({
      id: 'report-1',
      credibilityScore: 72.5,
    });
  });

  it('should forward source and flags to the ML client', async () => {
    mlClient.scoreCredibility.mockResolvedValue({ score: 50, factors: {} });

    await service.score({
      text: 'some text here',
      source: ReportSource.IMD,
      hasMedia: true,
      hasLocation: false,
      reportId: 'report-1',
    });

    expect(mlClient.scoreCredibility).toHaveBeenCalledWith({
      text: 'some text here',
      source: 'imd',
      hasMedia: true,
      hasLocation: false,
    });
  });
});