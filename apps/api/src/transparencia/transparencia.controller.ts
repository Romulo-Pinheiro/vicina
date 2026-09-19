import { Controller, Get } from '@nestjs/common';
import { ProblemsService } from '../problems/problems.service';

// Sem guard de propósito: dashboard público de transparência (ver
// CLAUDE.md, "Dashboard público (transparência)") — reforça a crítica de
// Pinho (2008) à falta de transparência real em portais de governo
// eletrônico, já citada na fundamentação teórica do artigo. Delega pra
// ProblemsService.getPublicStats() em vez de repetir a query aqui — o
// PainelGestor não tem aggregation própria no backend (deriva os números
// que mostra, mais simples, do GET /problems que já busca pra tabela), mas
// se algum dia precisar de agregados iguais aos daqui, é este método que
// deve reaproveitar, não uma segunda query.
@Controller('transparencia')
export class TransparenciaController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get('estatisticas')
  getEstatisticas() {
    return this.problemsService.getPublicStats();
  }
}
