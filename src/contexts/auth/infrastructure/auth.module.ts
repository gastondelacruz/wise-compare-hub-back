import { Module } from '@nestjs/common';
import { AuthController } from './adapters/http/auth.controller';
import { LoginService } from '@contexts/auth/application/use-cases/login.service';
import { LogoutService } from '@contexts/auth/application/use-cases/logout.service';
import { InMemoryUserRepository } from './adapters/persistence/in-memory-user.repository';
import { InMemoryTokenStore } from './adapters/persistence/in-memory-token-store';
import { MockJwtService } from './adapters/http/mock-jwt.service';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: 'LoginUseCase',
      useClass: LoginService,
    },
    {
      provide: 'LogoutUseCase',
      useClass: LogoutService,
    },
    {
      provide: 'UserRepository',
      useClass: InMemoryUserRepository,
    },
    {
      provide: 'TokenStore',
      useClass: InMemoryTokenStore,
    },
    {
      provide: 'TokenGenerator',
      useClass: MockJwtService,
    },
  ],
})
export class AuthModule {}
