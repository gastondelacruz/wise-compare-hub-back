import { Module } from '@nestjs/common';
import { AuthController } from './adapters/http/auth.controller';
import { LoginService } from '@contexts/auth/application/use-cases/login.service';
import { InMemoryUserRepository } from './adapters/persistence/in-memory-user.repository';
import { MockJwtService } from './adapters/http/mock-jwt.service';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: 'LoginUseCase',
      useClass: LoginService,
    },
    {
      provide: 'UserRepository',
      useClass: InMemoryUserRepository,
    },
    {
      provide: 'TokenGenerator',
      useClass: MockJwtService,
    },
  ],
})
export class AuthModule {}
