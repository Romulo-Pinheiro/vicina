import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

// Nunca inclui o hash de senha do autor do comentário — só id/nome.
const COMMENT_SELECT = {
  id: true,
  text: true,
  createdAt: true,
  user: { select: { id: true, name: true } },
} satisfies Prisma.CommentSelect;

type CommentWithAuthor = Prisma.CommentGetPayload<{
  select: typeof COMMENT_SELECT;
}>;

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateCommentDto,
    userId: string,
  ): Promise<CommentWithAuthor> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: dto.problemId },
      select: { id: true },
    });
    if (!problem) {
      throw new NotFoundException('Problema não encontrado');
    }

    const comment = await this.prisma.comment.create({
      data: { problemId: dto.problemId, userId, text: dto.text },
      select: COMMENT_SELECT,
    });
    this.logger.log(
      `Comentário criado: problema=${dto.problemId}, usuario=${userId}`,
    );
    return comment;
  }

  async findByProblem(problemId: string): Promise<CommentWithAuthor[]> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true },
    });
    if (!problem) {
      throw new NotFoundException('Problema não encontrado');
    }

    return this.prisma.comment.findMany({
      where: { problemId },
      select: COMMENT_SELECT,
      orderBy: { createdAt: 'asc' }, // ordem de conversa, não por relevância
    });
  }

  // Só o autor pode remover o próprio comentário — sem edição (PATCH): o
  // modelo de dados (ver CLAUDE.md) não prevê updatedAt/histórico para
  // Comment, e não há necessidade concreta identificada para justificar
  // adicionar esse campo agora (ver "simplicidade sobre generalização").
  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }
    if (comment.userId !== userId) {
      this.logger.warn(
        `Usuário ${userId} tentou remover o comentário ${id} sem ser o autor`,
      );
      throw new ForbiddenException(
        'Apenas o autor do comentário pode removê-lo',
      );
    }

    await this.prisma.comment.delete({ where: { id } });
    this.logger.log(`Comentário removido: ${id}`);
  }
}
