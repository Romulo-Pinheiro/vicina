import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Prisma 7 removeu o motor Rust embutido do PrismaClient: a connection
    // string não é mais lida do schema.prisma em runtime, precisa de um
    // driver adapter explícito. Ver https://pris.ly/d/prisma7-client-config.
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL não definida — configure apps/api/.env (ver .env.example)',
      );
    }
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit() {
    // Conexão explícita no boot: falha cedo (e de forma visível no log) se o
    // Postgres não estiver acessível, em vez de só falhar na primeira query
    // feita por um controller.
    await this.$connect();
    this.logger.log('Conectado ao PostgreSQL via Prisma');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
