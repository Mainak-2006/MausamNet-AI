import { Body, Controller, Post } from '@nestjs/common';
import { DuplicatesService } from './duplicates.service';
import { DetectDuplicateDto } from './dto/detect-duplicate.dto';

@Controller('duplicates')
export class DuplicatesController {
  constructor(private readonly duplicatesService: DuplicatesService) {}

  @Post('detect')
  async detect(@Body() dto: DetectDuplicateDto) {
    return this.duplicatesService.detect(dto);
  }
}