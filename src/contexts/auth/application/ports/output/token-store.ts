import { Token } from '@contexts/auth/domain/models/token.vo';

export interface TokenStore {
  save(token: Token): Promise<void>;
  exists(token: Token): Promise<boolean>;
  remove(token: Token): Promise<void>;
}
