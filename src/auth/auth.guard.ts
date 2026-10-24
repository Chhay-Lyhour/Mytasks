import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator.js';

export interface AuthenticatedUser {
  sub: number;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token, ...extraParts] = authorization?.split(' ') ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token || extraParts.length > 0) {
      throw new UnauthorizedException('A valid Bearer token is required');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<Record<string, unknown>>(token);
      const userId = this.readUserId(payload.sub);
      if (userId === null || typeof payload.email !== 'string') {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = { sub: userId, email: payload.email };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired Bearer token');
    }
  }

  private readUserId(sub: unknown): number | null {
    if (typeof sub === 'number' && Number.isInteger(sub) && sub > 0) {
      return sub;
    }
    if (typeof sub === 'string' && /^\d+$/.test(sub)) {
      const parsed = Number(sub);
      return parsed > 0 ? parsed : null;
    }
    return null;
  }
}
