import './instrument'; // Sentry must be initialised before anything else
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));
  // Serve local uploads in dev (no R2). In production this is a no-op — files live in R2.
  if (!process.env.R2_ACCOUNT_ID) {
    app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Swagger UI requires inline scripts and styles
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`,
            ...(process.env.R2_PUBLIC_DOMAIN ? [`https://${process.env.R2_PUBLIC_DOMAIN}`] : []),
          ],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      // Allow the frontend (different origin/port) to load images from /uploads
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // COEP can break non-CORP third-party resources; leave disabled
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
      },
    }),
  );

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://192.168.1.68:3000',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api');

  // ── Swagger / OpenAPI ──────────────────────────────────────────────────────
  // SwaggerModule.setup registers raw Express middleware and bypasses the
  // global 'api' prefix, so we pass the full path 'api/docs' explicitly.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Glimpse API')
    .setDescription('Invitation Builder SaaS — REST API reference')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter the JWT token returned by POST /api/auth/login',
      },
      'JWT',
    )
    .addTag('Auth', 'User registration and authentication')
    .addTag('Projects', 'Invitation project CRUD and lifecycle')
    .addTag('Elements', 'Canvas element operations within a project')
    .addTag('Publish', 'Publish/unpublish projects and public viewer')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  // ──────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(`Glimpse API running on http://localhost:${port}/api`);
  logger.log(`Swagger UI      → http://localhost:${port}/api/docs`);
}

bootstrap();
