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

// Select enxuto pra getPublicStats() — só o que entra em alguma conta ou
// média. Em especial, sem author: o endpoint por trás dessa agregação
// (GET /transparencia/estatisticas) é público e sem guard por decisão de
// escopo (ver CLAUDE.md, "Dashboard público (transparência)") — nunca deve
// devolver dado de usuário individual, só números agregados.
const STATS_SELECT = {
  status: true,
  createdAt: true,
  resolvedAt: true,
  category: { select: { name: true } },
} satisfies Prisma.ProblemSelect;

export interface PublicStats {
  total: number;
  abertos: number;
  resolvidos: number;
  percentualResolvidos: number;
  // null quando nenhum problema foi resolvido ainda — não faz sentido
  // calcular média de zero amostras.
  tempoMedioResolucaoDias: number | null;
  porCategoria: { categoria: string; total: number }[];
}

const DIA_EM_MS = 1000 * 60 * 60 * 24;

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

  // Reaproveitado por GET /transparencia/estatisticas (dashboard público) —
  // ver TransparenciaController. Uma query enxuta + agregação em memória, em
  // vez de várias chamadas separadas de count/groupBy/aggregate do Prisma:
  // pro volume esperado do teste com cidadãos (dezenas/centenas de
  // problemas, não milhões), isso é simples e rápido o suficiente, e evita
  // manter três queries em sincronia pra três números relacionados.
  async getPublicStats(): Promise<PublicStats> {
    const problems = await this.prisma.problem.findMany({
      select: STATS_SELECT,
    });

    const total = problems.length;
    const resolvidos = problems.filter(
      (problem) => problem.status === ProblemStatus.RESOLVIDO,
    ).length;
    const abertos = total - resolvidos;
    const percentualResolvidos =
      total > 0 ? Math.round((resolvidos / total) * 100) : 0;

    const duracoesResolucaoDias = problems
      .filter((problem) => problem.resolvedAt !== null)
      .map(
        (problem) =>
          (problem.resolvedAt!.getTime() - problem.createdAt.getTime()) /
          DIA_EM_MS,
      );
    const tempoMedioResolucaoDias =
      duracoesResolucaoDias.length > 0
        ? Math.round(
            (duracoesResolucaoDias.reduce((sum, dias) => sum + dias, 0) /
              duracoesResolucaoDias.length) *
              10,
          ) / 10
        : null;

    const contagemPorCategoria = new Map<string, number>();
    for (const problem of problems) {
      const nome = problem.category.name;
      contagemPorCategoria.set(nome, (contagemPorCategoria.get(nome) ?? 0) + 1);
    }
    const porCategoria = Array.from(
      contagemPorCategoria,
      ([categoria, categoriaTotal]) => ({ categoria, total: categoriaTotal }),
    );

    return {
      total,
      abertos,
      resolvidos,
      percentualResolvidos,
      tempoMedioResolucaoDias,
      porCategoria,
    };
  }
}
