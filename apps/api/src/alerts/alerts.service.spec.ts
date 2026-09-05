import { NotFoundException } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertSeverity, WeatherEvent } from '@mausamnet/shared';

describe('AlertsService', () => {
  let service: AlertsService;
  const alertRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const reportRepository = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AlertsService(
      alertRepository as never,
      reportRepository as never,
    );
  });

  it('should create an alert using the report event type', async () => {
    reportRepository.findOne.mockResolvedValue({
      id: 'report-1',
      eventType: WeatherEvent.FLOOD,
    });
    alertRepository.create.mockImplementation((dto) => dto);
    alertRepository.save.mockResolvedValue({ id: 'alert-1' });

    const result = await service.create({
      reportId: 'report-1',
      title: 'Flood warning',
      message: 'River is overflowing',
      severity: AlertSeverity.HIGH,
    });

    expect(alertRepository.create).toHaveBeenCalledWith({
      reportId: 'report-1',
      title: 'Flood warning',
      message: 'River is overflowing',
      eventType: WeatherEvent.FLOOD,
      severity: AlertSeverity.HIGH,
    });
    expect(result.id).toBe('alert-1');
  });

  it('should default severity to medium', async () => {
    reportRepository.findOne.mockResolvedValue({
      id: 'report-1',
      eventType: WeatherEvent.CYCLONE,
    });
    alertRepository.create.mockImplementation((dto) => dto);
    alertRepository.save.mockResolvedValue({ id: 'alert-1' });

    await service.create({
      reportId: 'report-1',
      title: 'Cyclone watch',
      message: 'System developing in the bay',
    });

    expect(alertRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ severity: AlertSeverity.MEDIUM }),
    );
  });

  it('should throw NotFoundException for a missing report', async () => {
    reportRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        reportId: 'missing',
        title: 'Title',
        message: 'Message body text here',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should toggle alert active state', async () => {
    alertRepository.findOne.mockResolvedValue({ id: 'alert-1', isActive: true });

    await service.setActive('alert-1', false);

    expect(alertRepository.save).toHaveBeenCalledWith({
      id: 'alert-1',
      isActive: false,
    });
  });
});