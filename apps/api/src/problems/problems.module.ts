import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';

// PrismaModule é global (ver src/prisma/prisma.module.ts) — não precisa
// reimportar aqui. JwtAuthGuard/CurrentUser vêm direto de auth/ como
// classes/funções comuns, sem precisar importar AuthModule.
@Module({
  controllers: [ProblemsController],
  providers: [ProblemsService],
})
export class ProblemsModule {}
