import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

// Expiração do token: 7 dias. Sem fluxo de refresh token nem blocklist de
// revogação — trade-off deliberado de escopo de protótipo (ver CLAUDE.md,
// "simplicidade sobre generalização"); revogação antecipada de sessão fica
// como trabalho futuro caso o protótipo evolua para produção.
const JWT_EXPIRES_IN = '7d';

@Module({
  imports: [
    PassportModule,
    // ConfigModule já é global (isGlobal: true em AppModule) — ConfigService
    // fica disponível aqui sem reimportar o módulo.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          // Mesmo check de JwtStrategy: falha cedo no boot em vez de assinar
          // tokens com um segredo vazio.
          throw new Error(
            'JWT_SECRET não definida — configure apps/api/.env (ver .env.example)',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: JWT_EXPIRES_IN },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // AuthService exportado para eventual reuso por outros módulos (ex.: um
  // módulo de gestão de usuários, se vier a existir); os guards e decorators
  // (JwtAuthGuard, RolesGuard, @Roles, @CurrentUser) são importados como
  // classes/funções comuns pelos módulos de domínio, sem precisar passar por
  // aqui.
  exports: [AuthService],
})
export class AuthModule {}
