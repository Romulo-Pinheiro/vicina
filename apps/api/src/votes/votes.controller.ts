import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SanitizedUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VotesService } from './votes.service';

// Módulo todo protegido: votar é uma ação de cidadão autenticado. A
// contagem pública de votos por problema já é exposta em
// GET /api/problems (via _count.votes) — este módulo não expõe listagem.
@Controller('votes')
@UseGuards(JwtAuthGuard)
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  create(@Body() dto: CreateVoteDto, @CurrentUser() user: SanitizedUser) {
    return this.votesService.create(dto.problemId, user.id);
  }

  @Delete(':problemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('problemId', ParseUUIDPipe) problemId: string,
    @CurrentUser() user: SanitizedUser,
  ) {
    return this.votesService.remove(problemId, user.id);
  }
}
