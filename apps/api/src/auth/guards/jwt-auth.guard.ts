import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Protege rotas exigindo um JWT válido no header Authorization (Bearer ...).
// Uso: @UseGuards(JwtAuthGuard) nos endpoints de escrita dos módulos de
// domínio (problems, votes, comments) que exigem um cidadão autenticado.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
