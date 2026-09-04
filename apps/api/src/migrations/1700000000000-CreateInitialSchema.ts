import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1700000000000 implements MigrationInterface {
  name = 'CreateInitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('citizen', 'admin')
    `);

    await queryRunner.query(`
      CREATE TYPE "reports_eventtype_enum" AS ENUM (
        'rainfall', 'flood', 'thunderstorm', 'heatwave',
        'strong_wind', 'cyclone', 'drought', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "reports_verificationstatus_enum" AS ENUM (
        'pending', 'verified', 'unverified', 'suspicious'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "verifications_status_enum" AS ENUM (
        'pending', 'verified', 'unverified', 'suspicious'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "alerts_eventtype_enum" AS ENUM (
        'rainfall', 'flood', 'thunderstorm', 'heatwave',
        'strong_wind', 'cyclone', 'drought', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'citizen',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);

    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL REFERENCES "users"("id"),
        "title" VARCHAR(500) NOT NULL,
        "description" TEXT NOT NULL,
        "eventType" "reports_eventtype_enum" NOT NULL,
        "latitude" DOUBLE PRECISION NOT NULL,
        "longitude" DOUBLE PRECISION NOT NULL,
        "city" VARCHAR(255) NOT NULL,
        "state" VARCHAR(255) NOT NULL,
        "country" VARCHAR(255) NOT NULL DEFAULT 'India',
        "source" VARCHAR(100) NOT NULL DEFAULT 'citizen',
        "sourceUrl" VARCHAR(1000),
        "reportDate" TIMESTAMP NOT NULL,
        "verificationStatus" "reports_verificationstatus_enum" NOT NULL DEFAULT 'pending',
        "credibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        "isDuplicate" BOOLEAN NOT NULL DEFAULT FALSE,
        "duplicateOfId" UUID,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_reports_userid" ON "reports" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_eventtype" ON "reports" ("eventType")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_verificationstatus" ON "reports" ("verificationStatus")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_city_state" ON "reports" ("city", "state")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_reportdate" ON "reports" ("reportDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_createdat" ON "reports" ("createdAt")`);

    await queryRunner.query(`
      CREATE TABLE "media" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "reportId" UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
        "type" VARCHAR(50) NOT NULL,
        "url" VARCHAR(1000) NOT NULL,
        "cloudinaryId" VARCHAR(500) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_media_reportid" ON "media" ("reportId")`);

    await queryRunner.query(`
      CREATE TABLE "verifications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "reportId" UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES "users"("id"),
        "status" "verifications_status_enum" NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_verifications_reportid" ON "verifications" ("reportId")`);
    await queryRunner.query(`CREATE INDEX "IDX_verifications_userid" ON "verifications" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE "alerts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "reportId" UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
        "title" VARCHAR(500) NOT NULL,
        "message" TEXT NOT NULL,
        "eventType" "alerts_eventtype_enum" NOT NULL,
        "severity" VARCHAR(50) NOT NULL DEFAULT 'medium',
        "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_alerts_reportid" ON "alerts" ("reportId")`);
    await queryRunner.query(`CREATE INDEX "IDX_alerts_eventtype" ON "alerts" ("eventType")`);
    await queryRunner.query(`CREATE INDEX "IDX_alerts_severity" ON "alerts" ("severity")`);
    await queryRunner.query(`CREATE INDEX "IDX_alerts_isactive" ON "alerts" ("isActive")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "alerts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "verifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "media"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alerts_eventtype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "verifications_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reports_verificationstatus_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reports_eventtype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}