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

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.problemsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProblemDto, @CurrentUser() user: SanitizedUser) {
    return this.problemsService.create(dto, user.id);
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard)
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveProblemDto,
    @CurrentUser() user: SanitizedUser,
  ) {
    return this.problemsService.resolve(id, user.id, dto);
  }
}
