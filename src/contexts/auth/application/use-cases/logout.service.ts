import { Injectable, Inject } from '@nestjs/common';
import { LogoutUseCase } from '../ports/input/logout-use-case';
import { TokenStore } from '../ports/output/token-store';
import { Token } from '@contexts/auth/domain/models/token.vo';

@Injectable()
export class LogoutService implements LogoutUseCase {
  constructor(
    @Inject('TokenStore')
    private readonly tokenStore: TokenStore,
  ) {}

  async execute(token: string): Promise<void> {
    const tokenVo = new Token(token);
    const exists = await this.tokenStore.exists(tokenVo);

    if (!exists) {
      throw new Error('Invalid or expired token');
    }

    await this.tokenStore.remove(tokenVo);
  }
}
