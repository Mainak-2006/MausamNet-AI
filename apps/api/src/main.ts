import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  if (!process.env.NODE_ENV) {
    logger.warn(
      'NODE_ENV is not set. Defaulting to non-production behaviour: ' +
        'fail-fast env validation is DISABLED, Swagger may be exposed and ' +
        'dev CORS origins are allowed. Set NODE_ENV=production on any real deployment.',
    );
  }

  const port = Number(process.env.PORT ?? 3002);
  const isProd = process.env.NODE_ENV === 'production';
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://0.0.0.0:3000',
  ];
  const corsOrigins = configuredOrigins.length
    ? [...new Set([...configuredOrigins, ...(isProd ? [] : devOrigins)])]
    : devOrigins;

  app.enableShutdownHooks();
  const httpAdapter = app.getHttpAdapter().getInstance() as {
    set: (k: string, v: unknown) => void;
  };
  httpAdapter.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.use(helmet());

  const httpLogger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      httpLogger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
      );
    });
    next();
  });

  app.enableCors({ origin: corsOrigins, credentials: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerEnabled =
    !isProd || process.env.SWAGGER_ENABLED === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('MausamNet-AI API')
      .setDescription('National Weather Big Data Analytics Platform API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);
  logger.log(`MausamNet-AI API listening on http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during API bootstrap:', err);
  process.exit(1);
});