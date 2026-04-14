import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
  await app.listen(port);
  console.log(`Glimpse API running on http://localhost:${port}/api`);
  console.log(`Swagger UI      → http://localhost:${port}/api/docs`);
}

bootstrap();
