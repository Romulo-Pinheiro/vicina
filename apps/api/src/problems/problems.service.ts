import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProblemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { ResolveProblemDto } from './dto/resolve-problem.dto';

// Select reaproveitado em todas as queries do módulo — nunca inclui o hash de
// senha do autor (Prisma traria o User inteiro sem essa restrição) e já
// carrega a contagem de votos/comentários para a página de Mapa consumir sem
// round-trip extra. Os módulos votes/comments ainda não existem, mas as
// tabelas já foram migradas — a contagem funciona desde já (fica 0 até lá).
const PROBLEM_SELECT = {
  id: true,
  title: true,
  description: true,
  latitude: true,
  longitude: true,
  status: true,
  resolvedAt: true,
  resolutionRating: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  author: { select: { id: true, name: true } },
  _count: { select: { votes: true, comments: true } },
} satisfies Prisma.ProblemSelect;

type ProblemWithRelations = Prisma.ProblemGetPayload<{
  select: typeof PROBLEM_SELECT;
}>;

@Injectable()
export class ProblemsService {
  private readonly logger = new Logger(ProblemsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateProblemDto,
    authorId: string,
  ): Promise<ProblemWithRelations> {
    try {
      const problem = await this.prisma.problem.create({
        data: {
          title: dto.title,
          description: dto.description,
          latitude: dto.latitude,
          longitude: dto.longitude,
          categoryId: dto.categoryId,
          authorId,
        },
        select: PROBLEM_SELECT,
      });
      this.logger.log(
        `Problema registrado: ${problem.id} (categoria=${dto.categoryId}, autor=${authorId})`,
      );
      return problem;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        // Violação de FK — categoryId não existe na taxonomia fixa (ver seed).
        throw new NotFoundException('Categoria informada não existe');
      }
      throw error;
    }
  }

  findAll(): Promise<ProblemWithRelations[]> {
    // Ordena por nº de votos (desc) — reflete a proposta central da
    // plataforma (acompanhar a priorização das demandas pelos cidadãos), não
    // só a ordem cronológica de registro.
    return this.prisma.problem.findMany({
      select: PROBLEM_SELECT,
      orderBy: [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<ProblemWithRelations> {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      select: PROBLEM_SELECT,
    });
    if (!problem) {
      throw new NotFoundException('Problema não encontrado');
    }
    return problem;
  }

  // Sem endpoint de exclusão, por decisão de escopo (ver CLAUDE.md, seção
  // "Trabalho futuro"): apagar registros contradiz o objetivo de
  // transparência que sustenta a proposta — um problema mal resolvido ou
  // abandonado deve continuar visível, não desaparecer.
  async resolve(
    id: string,
    userId: string,
    dto: ResolveProblemDto,
  ): Promise<ProblemWithRelations> {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) {
      throw new NotFoundException('Problema não encontrado');
    }
    if (problem.authorId !== userId) {
      this.logger.warn(
        `Usuário ${userId} tentou resolver o problema ${id} sem ser o autor`,
      );
      throw new ForbiddenException(
        'Apenas o autor do problema pode marcá-lo como resolvido',
      );
    }
    if (problem.status === ProblemStatus.RESOLVIDO) {
      throw new ConflictException('Este problema já está marcado como resolvido');
    }

    const updated = await this.prisma.problem.update({
      where: { id },
      data: {
        status: ProblemStatus.RESOLVIDO,
        resolvedAt: new Date(),
        resolutionRating: dto.resolutionRating ?? null,
      },
      select: PROBLEM_SELECT,
    });
    this.logger.log(
      `Problema resolvido: ${id} (rating=${dto.resolutionRating ?? 'n/a'})`,
    );
    return updated;
  }
}
