import { Role } from '@prisma/client';

// Formato do payload assinado dentro do JWT emitido em login/registro e lido
// de volta por JwtStrategy a cada requisição autenticada.
export interface JwtPayload {
  sub: string; // id do usuário (claim padrão do JWT para o "subject")
  email: string;
  role: Role;
}
