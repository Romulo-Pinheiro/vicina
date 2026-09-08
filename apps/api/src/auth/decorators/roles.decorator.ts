import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Marca um handler/controller com os papéis autorizados a acessá-lo. Só tem
// efeito combinado com RolesGuard (que lê esse metadado) e depois de
// JwtAuthGuard (que precisa ter populado request.user antes).
// Ex.: @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.GESTOR)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
