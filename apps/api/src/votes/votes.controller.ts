import {
  Body,
  Controller,
  Delete,
  Get,
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

  // Estado do voto do usuário atual pra um problema — usado pela página
  // DetalheProblema pra saber se mostra "Votar" ou "Remover voto".
  @Get(':problemId')
  async findMine(
    @Param('problemId', ParseUUIDPipe) problemId: string,
    @CurrentUser() user: SanitizedUser,
  ): Promise<{ voted: boolean }> {
    const voted = await this.votesService.hasVoted(problemId, user.id);
    return { voted };
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
