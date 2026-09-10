import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

// PrismaModule é global — não precisa reimportar aqui (mesmo padrão de
// problems/votes/auth).
@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
