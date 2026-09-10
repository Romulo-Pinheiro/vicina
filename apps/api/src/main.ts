import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
// import * as (não "import cookieParser from"): este tsconfig não tem
// esModuleInterop, então um import default de um módulo CommonJS puro
// (module.exports = fn, sem .default) compilaria pra `.default` undefined e
// quebraria silenciosamente em runtime — mesmo motivo do `import * as bcrypt`
// em auth.service.ts.
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Necessário pra req.cookies existir — JwtStrategy lê o JWT de
  // req.cookies.access_token (ver auth/strategies/jwt.strategy.ts). Sem
  // secret: o cookie não é assinado pelo cookie-parser porque o próprio JWT
  // já é assinado e se autovalida, uma segunda assinatura seria redundante.
  app.use(cookieParser());

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
  // hardcodar a URL de produção no código. credentials: true é obrigatório
  // pra o navegador enviar/aceitar o cookie httpOnly do JWT em requests
  // cross-origin — sem isso o cookie setado em /auth/login nunca voltaria
  // nas chamadas seguintes. (Nota: em produção, o rewrite do vercel.json faz
  // front/back parecerem same-origin pro navegador, então isso é sobretudo
  // uma rede de segurança para cenários sem esse rewrite, ex.: acessar a API
  // do Render diretamente em dev/staging.)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  Logger.log(`API rodando em http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
