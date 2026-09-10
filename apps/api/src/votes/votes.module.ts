import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

// PrismaModule é global — não precisa reimportar aqui (mesmo padrão de
// problems/auth).
@Module({
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
