import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo /api — casa com o proxy configurado em apps/web/vite.config.ts,
  // que encaminha /api/* do dev server do Vite para esta API.
  app.setGlobalPrefix('api');

  // Validação de entrada em todos os endpoints via DTOs com class-validator
  // (ver CLAUDE.md) — o pipe global aplica a validação automaticamente, sem
  // precisar repetir isso em cada rota.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS liberado apenas para a origem do frontend (Vite dev server
  // localmente, URL da Vercel em produção) — configurável via env para não
  // hardcodar a URL de produção no código.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  Logger.log(`API rodando em http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
