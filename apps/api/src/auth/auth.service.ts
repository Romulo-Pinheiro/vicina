import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

// Custo do bcrypt: 10 rounds é o padrão recomendado pela biblioteca — bom
// equilíbrio entre segurança (custo computacional para força bruta) e tempo
// de resposta aceitável em cada registro/login num protótipo.
const BCRYPT_SALT_ROUNDS = 10;

// Formato de usuário devolvido pela API — nunca inclui o hash da senha.
export interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResult {
  accessToken: string;
  user: SanitizedUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      this.logger.warn(
        `Tentativa de registro com email já cadastrado: ${dto.email}`,
      );
      throw new ConflictException('Já existe uma conta com este email');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    // Role não vem do DTO de registro: todo autocadastro nasce CIDADAO (valor
    // default do schema). O papel GESTOR é provisionado manualmente por
    // script/seed do administrador — ver decisão registrada em CLAUDE.md.
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
    });

    this.logger.log(`Novo usuário registrado: ${user.email} (role=${user.role})`);
    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Mensagem genérica tanto para "email não encontrado" quanto para "senha
    // incorreta" — evita que a resposta da API sirva para enumerar quais
    // emails têm conta cadastrada na plataforma.
    if (!user) {
      this.logger.warn(`Tentativa de login com email não cadastrado: ${dto.email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      this.logger.warn(`Tentativa de login com senha incorreta: ${dto.email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.log(`Login bem-sucedido: ${user.email}`);
    return this.buildAuthResult(user);
  }

  // Usado por JwtStrategy a cada requisição autenticada, para confirmar que o
  // usuário do token ainda existe (e recarregar seu estado atual — ex.: role)
  // em vez de confiar cegamente no payload assinado.
  async validateUserById(userId: string): Promise<SanitizedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.sanitize(user) : null;
  }

  private buildAuthResult(user: User): AuthResult {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: this.sanitize(user),
    };
  }

  private sanitize(user: User): SanitizedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
