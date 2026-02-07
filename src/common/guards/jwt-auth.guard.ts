import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface TokenPayload {
  sub?: string;
  email?: string;
}

interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user?: { id: string } | null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      request.user = null; // Optional auth
      return true;
    }

    try {
      const userId = this.decodeUserId(token);
      request.user = userId ? { id: userId } : null; // Attach to request
      return true;
    } catch {
      request.user = null;
      return true;
    }
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const auth = request.headers.authorization;
    if (!auth || typeof auth !== 'string') {
      return null;
    }
    return auth.startsWith('Bearer ') ? auth.substring(7) : null;
  }

  private decodeUserId(token: string): string | null {
    if (!token.startsWith('mock-jwt-')) {
      return null;
    }

    try {
      const base64Payload = token.substring(9);
      const payload = JSON.parse(
        Buffer.from(base64Payload, 'base64').toString('utf-8'),
      ) as TokenPayload;

      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}
