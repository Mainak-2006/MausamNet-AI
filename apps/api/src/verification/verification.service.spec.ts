import { NotFoundException } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationStatus } from '@mausamnet/shared';

describe('VerificationService', () => {
  let service: VerificationService;
  const verificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };
  const reportRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VerificationService(
      verificationRepository as never,
      reportRepository as never,
    );
  });

  it('should create a verification and update the report status', async () => {
    reportRepository.findOne.mockResolvedValue({
      id: 'report-1',
      verificationStatus: VerificationStatus.PENDING,
    });
    verificationRepository.create.mockImplementation((dto) => dto);
    verificationRepository.save.mockResolvedValue({
      id: 'verification-1',
      reportId: 'report-1',
      userId: 'user-1',
      status: VerificationStatus.VERIFIED,
    });

    const result = await service.verify(
      { reportId: 'report-1', status: VerificationStatus.VERIFIED, notes: 'checked' },
      'user-1',
    );

    expect(result.status).toBe(VerificationStatus.VERIFIED);
    expect(reportRepository.save).toHaveBeenCalledWith({
      id: 'report-1',
      verificationStatus: VerificationStatus.VERIFIED,
    });
  });

  it('should throw NotFoundException when the report does not exist', async () => {
    reportRepository.findOne.mockResolvedValue(null);

    await expect(
      service.verify(
        { reportId: 'missing', status: VerificationStatus.VERIFIED },
        'user-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});