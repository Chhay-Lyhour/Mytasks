import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthenticatedUser {
  sub: number;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token, ...extraParts] = authorization?.split(' ') ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token || extraParts.length > 0) {
      throw new UnauthorizedException('A valid Bearer token is required');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<Record<string, unknown>>(token);
      if (
        typeof payload.sub !== 'number' ||
        !Number.isInteger(payload.sub) ||
        payload.sub <= 0 ||
        typeof payload.email !== 'string'
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = { sub: payload.sub, email: payload.email };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired Bearer token');
    }
  }
}
