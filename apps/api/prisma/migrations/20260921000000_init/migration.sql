-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'VERIFIED', 'UNVERIFIED', 'SUSPICIOUS', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('RAINFALL', 'HEAVY_RAINFALL', 'FLOOD', 'FLASH_FLOOD', 'THUNDERSTORM', 'LIGHTNING', 'CYCLONE', 'HEATWAVE', 'COLD_WAVE', 'FOG', 'DENSE_FOG', 'DUST_STORM', 'STRONG_WIND', 'HAILSTORM', 'SNOWFALL', 'DROUGHT', 'LANDSLIDE', 'CLOUDBURST', 'WATERLOGGING', 'OTHER');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'SEVERE', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('CITIZEN', 'IMD', 'OPENWEATHER', 'WEATHERAPI', 'NEWS', 'INTERNET', 'IOT');

-- CreateEnum
CREATE TYPE "SyncLocationLevel" AS ENUM ('DISTRICT', 'CITY');

-- CreateEnum
CREATE TYPE "SyncTriggerType" AS ENUM ('SCHEDULED', 'MANUAL');

-- CreateEnum
CREATE TYPE "SyncRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "auth_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "avatar_url" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "credibility_score" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "EventCategory" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MODERATE',
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "city" TEXT,
    "state" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "SourceType" NOT NULL DEFAULT 'CITIZEN',
    "ai_prediction" "EventCategory",
    "ai_confidence" DOUBLE PRECISION,
    "credibility_score" INTEGER NOT NULL DEFAULT 50,
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicate_of_id" TEXT,
    "verification_notes" TEXT,
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "author_id" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "report_id" TEXT,
    "uploader_id" TEXT,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'HIGH',
    "city" TEXT,
    "state" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source" "SourceType" NOT NULL DEFAULT 'CITIZEN',
    "created_by_id" TEXT,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ALERT',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "reliability_score" INTEGER NOT NULL DEFAULT 70,
    "last_sync_at" TIMESTAMP(3),
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_snapshots" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "feels_like" DOUBLE PRECISION,
    "humidity" INTEGER,
    "pressure" INTEGER,
    "wind_speed" DOUBLE PRECISION,
    "wind_direction" INTEGER,
    "condition" TEXT,
    "source" "SourceType" NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location_id" TEXT,
    "run_id" TEXT,
    "meta" JSONB,

    CONSTRAINT "weather_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "type" "SyncLocationLevel" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "population" INTEGER,
    "coordinate_source" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" TEXT NOT NULL,
    "trigger" "SyncTriggerType" NOT NULL,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'QUEUED',
    "scope" TEXT NOT NULL DEFAULT 'all',
    "total" INTEGER NOT NULL DEFAULT 0,
    "succeeded" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "triggered_by" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "meta" JSONB,

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_schedule" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "next_run_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_auth_id_key" ON "profiles"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE INDEX "profiles_role_idx" ON "profiles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_category_idx" ON "reports"("category");

-- CreateIndex
CREATE INDEX "reports_severity_idx" ON "reports"("severity");

-- CreateIndex
CREATE INDEX "reports_state_city_idx" ON "reports"("state", "city");

-- CreateIndex
CREATE INDEX "reports_latitude_longitude_idx" ON "reports"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "reports_reported_at_idx" ON "reports"("reported_at");

-- CreateIndex
CREATE INDEX "media_report_id_idx" ON "media"("report_id");

-- CreateIndex
CREATE INDEX "media_uploader_id_idx" ON "media"("uploader_id");

-- CreateIndex
CREATE INDEX "alerts_is_active_category_idx" ON "alerts"("is_active", "category");

-- CreateIndex
CREATE INDEX "alerts_is_active_start_at_idx" ON "alerts"("is_active", "start_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "weather_snapshots_city_observed_at_idx" ON "weather_snapshots"("city", "observed_at");

-- CreateIndex
CREATE INDEX "weather_snapshots_state_observed_at_idx" ON "weather_snapshots"("state", "observed_at");

-- CreateIndex
CREATE INDEX "weather_snapshots_location_id_observed_at_idx" ON "weather_snapshots"("location_id", "observed_at");

-- CreateIndex
CREATE INDEX "sync_locations_state_type_idx" ON "sync_locations"("state", "type");

-- CreateIndex
CREATE INDEX "sync_locations_type_idx" ON "sync_locations"("type");

-- CreateIndex
CREATE INDEX "sync_runs_status_started_at_idx" ON "sync_runs"("status", "started_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_duplicate_of_id_fkey" FOREIGN KEY ("duplicate_of_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "sync_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "sync_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

