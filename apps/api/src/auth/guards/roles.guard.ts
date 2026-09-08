import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { SanitizedUser } from '../auth.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Restringe uma rota a papéis específicos (hoje, na prática, só GESTOR — ver
// PainelGestor em CLAUDE.md). Assume que JwtAuthGuard já rodou antes e
// populou request.user; por isso é sempre usado em conjunto com ele:
// @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.GESTOR)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sem @Roles(...) no handler, a rota fica liberada para qualquer usuário
    // autenticado — a restrição de papel é opt-in.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: SanitizedUser }>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Acesso restrito ao papel de gestor');
    }
    return true;
  }
}
