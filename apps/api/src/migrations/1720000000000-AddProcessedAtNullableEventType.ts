import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProcessedAtNullableEventType1720000000000
  implements MigrationInterface
{
  name = 'AddProcessedAtNullableEventType1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reports" ALTER COLUMN "eventType" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" ADD COLUMN "processedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reports" DROP COLUMN "processedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" ALTER COLUMN "eventType" SET NOT NULL`,
    );
  }
}
