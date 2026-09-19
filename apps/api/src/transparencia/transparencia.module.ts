import { Module } from '@nestjs/common';
import { ProblemsModule } from '../problems/problems.module';
import { TransparenciaController } from './transparencia.controller';

// Sem service próprio: a agregação vive em ProblemsService.getPublicStats()
// (ver problems/problems.module.ts, que exporta o service pra isso) — este
// módulo só expõe a rota pública em cima dela.
@Module({
  imports: [ProblemsModule],
  controllers: [TransparenciaController],
})
export class TransparenciaModule {}
