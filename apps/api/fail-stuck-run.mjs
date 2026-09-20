import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const run = await p.syncRun.findFirst({
  where: { id: '3fdaeae3-3bda-4cd6-862d-ed280f4fb492' },
});
if (!run) {
  console.log('stuck run not found — already resolved');
} else if (run.status !== 'RUNNING') {
  console.log(`run already terminal: ${run.status}`);
} else {
  const updated = await p.syncRun.update({
    where: { id: run.id },
    data: { status: 'FAILED', error: 'MANUAL_ABORT', finishedAt: new Date() },
  });
  console.log(`failed stuck run: status=${updated.status} ok=${updated.succeeded}/${updated.total}`);
}
await p.$disconnect();