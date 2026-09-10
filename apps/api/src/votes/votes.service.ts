import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Vote } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VotesService {
  private readonly logger = new Logger(VotesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(problemId: string, userId: string): Promise<Vote> {
    // Confere a existência do problema antes de tentar o insert — sem isso,
    // um problemId inválido cairia na mesma violação de FK e seria mais
    // difícil de diferenciar de outros erros no catch abaixo.
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true },
    });
    if (!problem) {
      throw new NotFoundException('Problema não encontrado');
    }

    try {
      const vote = await this.prisma.vote.create({
        data: { problemId, userId },
      });
      this.logger.log(`Voto registrado: problema=${problemId}, usuario=${userId}`);
      return vote;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Violação de @@unique([problemId, userId]) — cidadão só vota uma
        // vez por problema (ver CLAUDE.md).
        throw new ConflictException('Você já votou neste problema');
      }
      throw error;
    }
  }

  async remove(problemId: string, userId: string): Promise<void> {
    try {
      await this.prisma.vote.delete({
        where: { problemId_userId: { problemId, userId } },
      });
      this.logger.log(`Voto removido: problema=${problemId}, usuario=${userId}`);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Voto não encontrado');
      }
      throw error;
    }
  }
}
