import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';

// PrismaModule é global (ver src/prisma/prisma.module.ts) — não precisa
// reimportar aqui. JwtAuthGuard/CurrentUser vêm direto de auth/ como
// classes/funções comuns, sem precisar importar AuthModule.
//
// Exporta ProblemsService pra o TransparenciaModule reaproveitar
// getPublicStats() sem duplicar a query de agregação (ver
// transparencia/transparencia.module.ts).
@Module({
  controllers: [ProblemsController],
  providers: [ProblemsService],
  exports: [ProblemsService],
})
export class ProblemsModule {}
