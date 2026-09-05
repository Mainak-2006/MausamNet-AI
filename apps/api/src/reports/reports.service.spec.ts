import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const reportRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const reportProcessingService = {
    processReport: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportsService(
      reportRepository as never,
      reportProcessingService as never,
    );
  });

  describe('backfillUnprocessed', () => {
    it('queues AI processing for reports where processedAt is null', async () => {
      reportRepository.find.mockResolvedValue([
        { id: 'report-1' },
        { id: 'report-2' },
      ]);

      const result = await service.backfillUnprocessed();

      expect(reportRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ processedAt: expect.anything() }),
          take: 100,
        }),
      );
      expect(reportProcessingService.processReport).toHaveBeenCalledWith(
        'report-1',
      );
      expect(reportProcessingService.processReport).toHaveBeenCalledWith(
        'report-2',
      );
      expect(result).toEqual({ queued: 2, limit: 100 });
    });

    it('caps the batch at 200 reports', async () => {
      reportRepository.find.mockResolvedValue([]);

      await service.backfillUnprocessed(9999);

      expect(reportRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 200 }),
      );
    });

    it('respects an explicit small limit', async () => {
      reportRepository.find.mockResolvedValue([{ id: 'report-1' }]);

      await service.backfillUnprocessed(5);

      expect(reportRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });
});