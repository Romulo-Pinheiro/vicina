import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, SanitizedUser } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      // Falha cedo no boot, no mesmo espírito do check de DATABASE_URL feito
      // em PrismaService — melhor travar a inicialização do que subir a API
      // aceitando (ou emitindo) tokens assinados com um segredo vazio.
      throw new Error(
        'JWT_SECRET não definida — configure apps/api/.env (ver .env.example)',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Chamado pelo Passport depois de verificar a assinatura/expiração do
  // token. O retorno aqui vira `request.user` em todo controller protegido
  // por JwtAuthGuard.
  async validate(payload: JwtPayload): Promise<SanitizedUser> {
    // Recarrega o usuário do banco a cada requisição (em vez de confiar só no
    // payload do JWT) para refletir imediatamente uma troca de role ou conta
    // removida. Custo: uma query extra por requisição autenticada — aceitável
    // na escala de protótipo, mas é o tipo de escolha que pesa no limite de
    // conexões do Postgres gratuito do Render em produção.
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      this.logger.warn(`Token JWT válido para usuário inexistente: ${payload.sub}`);
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return user;
  }
}
