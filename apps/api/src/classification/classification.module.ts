import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MlClientModule } from '../ml-client/ml-client.module';
import { ClassificationService } from './classification.service';
import { ClassificationController } from './classification.controller';
import { Report } from '../entities/report.entity';

@Module({
  imports: [MlClientModule, TypeOrmModule.forFeature([Report])],
  controllers: [ClassificationController],
  providers: [ClassificationService],
  exports: [ClassificationService],
})
export class ClassificationModule {}