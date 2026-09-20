import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const run = await p.syncRun.findFirst({ orderBy: { startedAt: 'desc' } });
console.log(JSON.stringify({
  id: run.id, scope: run.scope, status: run.status,
  ok: run.succeeded, failed: run.failed, skipped: run.skipped, total: run.total,
  error: run.error,
}));
await p.$disconnect();