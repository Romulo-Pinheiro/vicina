import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { SanitizedUser } from '../auth.service';

// Extrai o usuário autenticado anexado por JwtStrategy (request.user).
// Só produz um valor confiável em rotas protegidas por JwtAuthGuard — usar
// sem o guard resultaria em `undefined`.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SanitizedUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: SanitizedUser }>();
    return request.user;
  },
);
