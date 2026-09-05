import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationStatus } from '@mausamnet/shared';
import { Verification } from '../entities/verification.entity';
import { Report } from '../entities/report.entity';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async verify(
    dto: {
      reportId: string;
      status: VerificationStatus;
      notes?: string;
    },
    userId: string,
  ): Promise<Verification> {
    const report = await this.reportRepository.findOne({
      where: { id: dto.reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const verification = this.verificationRepository.create({
      reportId: dto.reportId,
      userId,
      status: dto.status,
      notes: dto.notes,
    });

    const saved = await this.verificationRepository.save(verification);

    report.verificationStatus = dto.status;
    await this.reportRepository.save(report);

    return saved;
  }

  async findByReportId(reportId: string): Promise<Verification[]> {
    return this.verificationRepository.find({
      where: { reportId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Verification[]> {
    return this.verificationRepository.find({
      relations: { report: true, user: true },
      order: { createdAt: 'DESC' },
    });
  }
}