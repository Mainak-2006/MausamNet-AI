import { Body, Controller, Post } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { ClassifyReportDto } from './dto/classify-report.dto';

@Controller('classification')
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @Post()
  async classify(@Body() dto: ClassifyReportDto) {
    return this.classificationService.classify(dto.text, dto.reportId);
  }
}