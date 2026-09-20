import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface OverviewRow {
  total: number;
  verified: number;
  pending: number;
  suspicious: number;
  rejected: number;
  today: number;
  activeAlerts: number;
  highSeverity: number;
  registeredUsers: number;
  avgCredibility: number | null;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * All dashboard counts are computed in a single round-trip. Spawning one
   * Prisma query per count saturates the connection pool (Supabase transaction
   * poolers cap at ~17 connections) as soon as a few admin/dashboard requests
   * hit the API concurrently, timing out with "connection pool" errors.
   */
  async overview() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [row] = await this.prisma.$queryRaw<OverviewRow[]>`
      SELECT
        (SELECT COUNT(*)::int FROM "reports")                                     AS "total",
        (SELECT COUNT(*)::int FROM "reports" WHERE "status" = 'VERIFIED')         AS "verified",
        (SELECT COUNT(*)::int FROM "reports" WHERE "status" = 'PENDING')          AS "pending",
        (SELECT COUNT(*)::int FROM "reports" WHERE "status" = 'SUSPICIOUS')       AS "suspicious",
        (SELECT COUNT(*)::int FROM "reports" WHERE "status" = 'REJECTED')         AS "rejected",
        (SELECT COUNT(*)::int FROM "reports" WHERE "reported_at" >= ${startOfToday}) AS "today",
        (SELECT COUNT(*)::int FROM "alerts" WHERE is_active = true)               AS "activeAlerts",
        (SELECT COUNT(*)::int FROM "reports"
          WHERE "severity" IN ('HIGH', 'SEVERE', 'CRITICAL'))                     AS "highSeverity",
        (SELECT COUNT(*)::int FROM "profiles")                                    AS "registeredUsers",
        (SELECT ROUND(AVG("credibility_score"))::int FROM "reports")              AS "avgCredibility"
    `;

    return {
      totalReports: row?.total ?? 0,
      verifiedReports: row?.verified ?? 0,
      pendingReports: row?.pending ?? 0,
      suspiciousReports: row?.suspicious ?? 0,
      rejectedReports: row?.rejected ?? 0,
      todayReports: row?.today ?? 0,
      activeAlerts: row?.activeAlerts ?? 0,
      highSeverity: row?.highSeverity ?? 0,
      registeredUsers: row?.registeredUsers ?? 0,
      avgCredibility: row?.avgCredibility ?? 0,
    };
  }

  async events() {
    const grouped = await this.prisma.report.groupBy({
      by: ['category'],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ category: g.category, count: g._count._all }));
  }

  async regions() {
    const byState = await this.prisma.report.groupBy({
      by: ['state'],
      _count: { _all: true },
    });
    const states = byState
      .filter((s) => s.state)
      .map((s) => ({
        state: s.state,
        count: s._count._all ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const byCity = await this.prisma.report.groupBy({
      by: ['city'],
      _count: { _all: true },
    });
    const cities = byCity
      .filter((c) => c.city)
      .map((c) => ({
        city: c.city,
        count: c._count._all ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return { states, cities };
  }

  async timeline(days = 7) {
    const limit = Math.min(90, Math.max(1, days));
    const start = new Date();
    start.setDate(start.getDate() - (limit - 1));
    start.setHours(0, 0, 0, 0);

    const rows = await this.prisma.report.findMany({
      where: { reportedAt: { gte: start } },
      select: { reportedAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < limit; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const row of rows) {
      const key = row.reportedAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }
}