import { Body, Controller, Post } from '@nestjs/common';
import { CredibilityService } from './credibility.service';
import { ScoreCredibilityDto } from './dto/score-credibility.dto';

@Controller('credibility')
export class CredibilityController {
  constructor(private readonly credibilityService: CredibilityService) {}

  @Post()
  async score(@Body() dto: ScoreCredibilityDto) {
    return this.credibilityService.score(dto);
  }
}