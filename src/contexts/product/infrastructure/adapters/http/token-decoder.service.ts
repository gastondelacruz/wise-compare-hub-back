import { Injectable } from '@nestjs/common';

interface TokenPayload {
  sub?: string;
  email?: string;
}

@Injectable()
export class TokenDecoderService {
  decodeUserId(token: string | null): string | null {
    if (!token) {
      return null;
    }

    try {
      if (!token.startsWith('mock-jwt-')) {
        return null;
      }

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
