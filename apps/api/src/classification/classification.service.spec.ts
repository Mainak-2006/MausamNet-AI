import { NotFoundException } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { MlClientService } from '../ml-client/ml-client.service';

describe('ClassificationService', () => {
  let service: ClassificationService;
  const reportRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const mlClient = {
    classify: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClassificationService(
      mlClient as unknown as MlClientService,
      reportRepository as never,
    );
  });

  it('should call the ML service and persist the event type', async () => {
    mlClient.classify.mockResolvedValue({
      eventType: 'cyclone',
      confidence: 0.88,
      probabilities: {},
    });
    reportRepository.findOne.mockResolvedValue({ id: 'report-1', eventType: 'other' });

    const result = await service.classify('cyclonic storm approaching', 'report-1');

    expect(result.eventType).toBe('cyclone');
    expect(reportRepository.findOne).toHaveBeenCalledWith({ where: { id: 'report-1' } });
    expect(reportRepository.save).toHaveBeenCalledWith({
      id: 'report-1',
      eventType: 'cyclone',
    });
  });

  it('should not persist when reportId is not provided', async () => {
    mlClient.classify.mockResolvedValue({
      eventType: 'flood',
      confidence: 0.9,
      probabilities: {},
    });

    await service.classify('flooding reported');

    expect(reportRepository.findOne).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException for a missing report', async () => {
    mlClient.classify.mockResolvedValue({
      eventType: 'flood',
      confidence: 0.9,
      probabilities: {},
    });
    reportRepository.findOne.mockResolvedValue(null);

    await expect(service.classify('flooding', 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});