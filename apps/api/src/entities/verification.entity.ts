import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { VerificationStatus } from '@mausamnet/shared';
import { Report } from './report.entity';
import { User } from './user.entity';

@Entity('verifications')
@Index('IDX_verifications_reportid', ['reportId'])
@Index('IDX_verifications_userid', ['userId'])
export class Verification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reportId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: VerificationStatus })
  status: VerificationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Report, (report) => report.verifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reportId' })
  report: Report;

  @ManyToOne(() => User, (user) => user.verifications)
  @JoinColumn({ name: 'userId' })
  user: User;
}