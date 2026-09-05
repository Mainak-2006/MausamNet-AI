import { ReportProcessingService } from './report-processing.service';
import { Report } from '../entities/report.entity';

describe('ReportProcessingService', () => {
  let service: ReportProcessingService;

  const classificationService = {
    classify: jest.fn(),
  };
  const credibilityService = {
    score: jest.fn(),
  };
  const duplicatesService = {
    detect: jest.fn(),
  };
  const reportRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const report = {
    id: 'report-1',
    description: 'Heavy rainfall of 15mm recorded in Mumbai',
    source: 'citizen',
    media: [],
    latitude: 19.07,
    longitude: 72.87,
  } as Report;

  beforeEach(() => {
    jest.clearAllMocks();

    classificationService.classify.mockResolvedValue({
      eventType: 'rainfall',
      confidence: 0.9,
    });
    credibilityService.score.mockResolvedValue({ score: 75, factors: {} });
    duplicatesService.detect.mockResolvedValue({
      isDuplicate: false,
      similarityScore: 0.1,
    });

    service = new ReportProcessingService(
      classificationService as never,
      credibilityService as never,
      duplicatesService as never,
      reportRepository as never,
    );
  });

  describe('processReport', () => {
    it('runs classification, credibility and duplicate detection in sequence', async () => {
      reportRepository.findOne.mockResolvedValue(report);

      await service.processReport(report.id);

      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: report.id },
        relations: { media: true },
      });
      expect(classificationService.classify).toHaveBeenCalledWith(
        report.description,
        report.id,
      );
      expect(credibilityService.score).toHaveBeenCalledWith(
        expect.objectContaining({ reportId: report.id }),
      );
      expect(duplicatesService.detect).toHaveBeenCalledWith(
        expect.objectContaining({ reportId: report.id }),
      );
    });

    it('does nothing when the report does not exist', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await service.processReport('missing-id');

      expect(classificationService.classify).not.toHaveBeenCalled();
      expect(credibilityService.score).not.toHaveBeenCalled();
      expect(duplicatesService.detect).not.toHaveBeenCalled();
      expect(reportRepository.save).not.toHaveBeenCalled();
      expect(reportRepository.update).not.toHaveBeenCalled();
    });

    it('continues with the next step when one AI step fails', async () => {
      reportRepository.findOne.mockResolvedValue(report);
      classificationService.classify.mockRejectedValue(
        new Error('ml service down'),
      );

      await service.processReport(report.id);

      expect(credibilityService.score).toHaveBeenCalled();
      expect(duplicatesService.detect).toHaveBeenCalled();
      expect(reportRepository.update).toHaveBeenCalled();
    });

    it('passes media presence and location to credibility scoring', async () => {
      reportRepository.findOne.mockResolvedValue({
        ...report,
        media: [{ id: 'm1' }],
      });

      await service.processReport(report.id);

      expect(credibilityService.score).toHaveBeenCalledWith(
        expect.objectContaining({ hasMedia: true, hasLocation: true }),
      );
    });

    it('passes hasLocation false when coordinates are missing', async () => {
      reportRepository.findOne.mockResolvedValue({
        ...report,
        latitude: null,
        longitude: null,
      });

      await service.processReport(report.id);

      expect(credibilityService.score).toHaveBeenCalledWith(
        expect.objectContaining({ hasLocation: false }),
      );
    });

    it('marks the report as processed with a processedAt timestamp', async () => {
      reportRepository.findOne.mockResolvedValue(report);
      reportRepository.save.mockResolvedValue({ ...report });

      await service.processReport(report.id);

      expect(reportRepository.update).toHaveBeenCalledWith(
        report.id,
        expect.objectContaining({ processedAt: expect.any(Date) }),
      );
    });

    it('does not clobber persisted AI results with stale report values', async () => {
      reportRepository.findOne.mockResolvedValue(report);

      await service.processReport(report.id);

      expect(reportRepository.save).not.toHaveBeenCalled();
      expect(reportRepository.update).toHaveBeenCalledTimes(1);
    });
  });
});