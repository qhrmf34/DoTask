import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';

export function Roles(...roles: string[]) {
  return (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value ?? target);
    return descriptor ?? target;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!required.includes(user?.role)) throw new ForbiddenException();
    return true;
  }
}
