import { Injectable } from '@nestjs/common';
import { TokenStore } from '@contexts/auth/application/ports/output/token-store';
import { Token } from '@contexts/auth/domain/models/token.vo';

@Injectable()
export class InMemoryTokenStore implements TokenStore {
  private readonly tokens: Set<string>;

  constructor() {
    this.tokens = new Set();
  }

  save(token: Token): Promise<void> {
    this.tokens.add(token.value);
    return Promise.resolve();
  }

  exists(token: Token): Promise<boolean> {
    return Promise.resolve(this.tokens.has(token.value));
  }

  remove(token: Token): Promise<void> {
    this.tokens.delete(token.value);
    return Promise.resolve();
  }
}
