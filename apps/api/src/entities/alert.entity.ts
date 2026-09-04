import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WeatherEvent, AlertSeverity } from '@mausamnet/shared';
import { Report } from './report.entity';

@Entity('alerts')
@Index('IDX_alerts_reportid', ['reportId'])
@Index('IDX_alerts_eventtype', ['eventType'])
@Index('IDX_alerts_severity', ['severity'])
@Index('IDX_alerts_isactive', ['isActive'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reportId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: WeatherEvent })
  eventType: WeatherEvent;

  @Column({ type: 'varchar', length: 50, default: AlertSeverity.MEDIUM })
  severity: AlertSeverity;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Report, (report) => report.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report: Report;
}