import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Report } from './report.entity';

@Entity('media')
@Index('IDX_media_reportid', ['reportId'])
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reportId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 1000 })
  url: string;

  @Column({ type: 'varchar', length: 500 })
  cloudinaryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Report, (report) => report.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report: Report;
}