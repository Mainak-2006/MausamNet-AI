import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MlClientModule } from '../ml-client/ml-client.module';
import { DuplicatesService } from './duplicates.service';
import { DuplicatesController } from './duplicates.controller';
import { Report } from '../entities/report.entity';

@Module({
  imports: [MlClientModule, TypeOrmModule.forFeature([Report])],
  controllers: [DuplicatesController],
  providers: [DuplicatesService],
  exports: [DuplicatesService],
})
export class DuplicatesModule {}