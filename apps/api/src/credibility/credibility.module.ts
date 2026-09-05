import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MlClientModule } from '../ml-client/ml-client.module';
import { CredibilityService } from './credibility.service';
import { CredibilityController } from './credibility.controller';
import { Report } from '../entities/report.entity';

@Module({
  imports: [MlClientModule, TypeOrmModule.forFeature([Report])],
  controllers: [CredibilityController],
  providers: [CredibilityService],
  exports: [CredibilityService],
})
export class CredibilityModule {}