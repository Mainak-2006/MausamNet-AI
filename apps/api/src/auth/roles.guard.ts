import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { AuthedUser } from './types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthedUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Authentication required');

    const hasAccess = requiredRoles.some((role) => {
      if (user.role === Role.SUPER_ADMIN) return true;
      return user.role === role;
    });
    if (!hasAccess) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}