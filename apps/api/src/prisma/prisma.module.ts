import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global(): PrismaService é usado por todos os módulos de domínio
// (auth, problems, votes, comments) — evita reimportar PrismaModule em cada
// um deles conforme forem criados.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
