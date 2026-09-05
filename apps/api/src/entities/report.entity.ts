import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { WeatherEvent, VerificationStatus, ReportSource } from '@mausamnet/shared';
import { User } from './user.entity';
import { Media } from './media.entity';
import { Verification } from './verification.entity';
import { Alert } from './alert.entity';

@Entity('reports')
@Index('IDX_reports_userid', ['userId'])
@Index('IDX_reports_eventtype', ['eventType'])
@Index('IDX_reports_verificationstatus', ['verificationStatus'])
@Index('IDX_reports_city_state', ['city', 'state'])
@Index('IDX_reports_reportdate', ['reportDate'])
@Index('IDX_reports_createdat', ['createdAt'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: WeatherEvent, nullable: true })
  eventType: WeatherEvent | null;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  @Column({ type: 'varchar', length: 255 })
  city: string;

  @Column({ type: 'varchar', length: 255 })
  state: string;

  @Column({ type: 'varchar', length: 255, default: 'India' })
  country: string;

  @Column({ type: 'varchar', length: 100, default: ReportSource.CITIZEN })
  source: ReportSource;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  sourceUrl: string;

  @Column({ type: 'timestamp' })
  reportDate: Date;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({ type: 'double precision', default: 0.0 })
  credibilityScore: number;

  @Column({ type: 'boolean', default: false })
  isDuplicate: boolean;

  @Column({ type: 'uuid', nullable: true })
  duplicateOfId: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.reports)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Media, (media) => media.report)
  media: Media[];

  @OneToMany(() => Verification, (verification) => verification.report)
  verifications: Verification[];

  @OneToMany(() => Alert, (alert) => alert.report)
  alerts: Alert[];
}