import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SanitizedUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AvaliarProblemDto } from './dto/avaliar-problem.dto';
import { CreateProblemDto } from './dto/create-problem.dto';
import { ResolveProblemDto } from './dto/resolve-problem.dto';
import { ProblemsService } from './problems.service';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  // Sem guard: listar/ver problemas é público — a transparência do mapa vale
  // antes mesmo de o visitante criar conta (só reportar/resolver exige login).
  @Get()
  findAll() {
    return this.problemsService.findAll();
  }

  // Precisa vir ANTES de @Get(':id') — senão "pendentes-avaliacao" seria
  // capturado como o :id daquela rota (e falharia no ParseUUIDPipe).
  // Autenticado: pendências são sempre do usuário logado, nunca de terceiro.
  @Get('pendentes-avaliacao')
  @UseGuards(JwtAuthGuard)
  findPendingEvaluation(@CurrentUser() user: SanitizedUser) {
    return this.problemsService.findPendingEvaluation(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.problemsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProblemDto, @CurrentUser() user: SanitizedUser) {
    return this.problemsService.create(dto, user.id);
  }

  // Autor original OU gestor (ver ProblemsService.resolve para a regra
  // completa — rating só do autor, nota de qualquer um dos dois).
  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard)
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveProblemDto,
    @CurrentUser() user: SanitizedUser,
  ) {
    return this.problemsService.resolve(id, user, dto);
  }

  // Avaliação assíncrona (ver CLAUDE.md) — só o autor original, só depois de
  // resolvido, só uma vez. Chamado pelo modal que o Mapa abre quando há
  // pendência (ver GET /problems/pendentes-avaliacao acima).
  @Patch(':id/avaliar')
  @UseGuards(JwtAuthGuard)
  avaliar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AvaliarProblemDto,
    @CurrentUser() user: SanitizedUser,
  ) {
    return this.problemsService.avaliar(id, user.id, dto);
  }
}
