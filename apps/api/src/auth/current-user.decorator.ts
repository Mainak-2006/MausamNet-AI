import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthedUser } from './types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthedUser }>();
    return request.user;
  },
);