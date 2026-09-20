process.chdir(__dirname);
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { SyncService } = require('./dist/sync/sync.service');
const { SyncTriggerType } = require('@prisma/client');

(async () => {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  let sync;
  try {
    sync = app.get(SyncService);
    const res = await sync.startRun(SyncTriggerType.MANUAL, 'all', 'ops-fix');
    console.log('TRIGGER_RESULT', JSON.stringify(res));
  } finally {
    if (sync) {
      await app.close().catch(() => undefined);
    }
    process.exit(0);
  }
})();