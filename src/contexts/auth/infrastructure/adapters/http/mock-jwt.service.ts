import { Injectable } from '@nestjs/common';
import { TokenGenerator } from '@contexts/auth/application/ports/output/token-generator';
import { User } from '@contexts/auth/domain/models/user.entity';

@Injectable()
export class MockJwtService implements TokenGenerator {
  generate(user: User): Promise<string> {
    // Mock JWT token generation
    const payload = {
      sub: user.id.value,
      email: user.email.value,
    };
    const mockToken = `mock-jwt-${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
    return Promise.resolve(mockToken);
  }
}
