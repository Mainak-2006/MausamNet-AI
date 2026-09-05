import { DuplicatesService } from './duplicates.service';
import { MlClientService } from '../ml-client/ml-client.service';

describe('DuplicatesService', () => {
  let service: DuplicatesService;
  const reportRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const mlClient = {
    detectDuplicates: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DuplicatesService(
      mlClient as unknown as MlClientService,
      reportRepository as never,
    );
  });

  it('should mark a report as a duplicate when ML matches', async () => {
    reportRepository.find.mockResolvedValue([
      { id: 'existing-1', description: 'flood in the city' },
      { id: 'existing-2', description: 'heatwave today' },
    ]);
    mlClient.detectDuplicates.mockResolvedValue({
      isDuplicate: true,
      similarToIndex: 0,
      similarityScore: 0.91,
      duplicateOf: 'flood in the city',
    });
    reportRepository.findOne.mockResolvedValue({ id: 'new-1', isDuplicate: false });

    const result = await service.detect({
      text: 'flood in the city',
      reportId: 'new-1',
    });

    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateOfId).toBe('existing-1');
    expect(reportRepository.save).toHaveBeenCalledWith({
      id: 'new-1',
      isDuplicate: true,
      duplicateOfId: 'existing-1',
    });
  });

  it('should not persist when the target report is not found', async () => {
    reportRepository.find.mockResolvedValue([
      { id: 'existing-1', description: 'flood in the city' },
    ]);
    mlClient.detectDuplicates.mockResolvedValue({
      isDuplicate: true,
      similarToIndex: 0,
      similarityScore: 0.99,
      duplicateOf: 'flood in the city',
    });
    reportRepository.findOne.mockResolvedValue(null);

    await expect(
      service.detect({ text: 'duplicate text', reportId: 'missing' }),
    ).rejects.toThrow();
    expect(reportRepository.save).not.toHaveBeenCalled();
  });

  it('should exclude the report itself from candidates', async () => {
    reportRepository.find.mockResolvedValue([
      { id: 'same-report', description: 'hello' },
      { id: 'other-report', description: 'world' },
    ]);
    mlClient.detectDuplicates.mockResolvedValue({
      isDuplicate: false,
      similarToIndex: null,
      similarityScore: 0.1,
      duplicateOf: null,
    });

    await service.detect({ text: 'hello', reportId: 'same-report' });

    expect(mlClient.detectDuplicates).toHaveBeenCalledWith(
      'hello',
      ['world'],
      undefined,
    );
  });
});