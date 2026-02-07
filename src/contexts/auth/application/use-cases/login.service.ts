import { Injectable, Inject } from '@nestjs/common';
import { LoginUseCase } from '../ports/input/login-use-case';
import { LoginCommand } from '../dto/login-command';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UserRepository } from '../ports/output/user.repository';
import { TokenGenerator } from '../ports/output/token-generator';
import { Email } from '@contexts/auth/domain/models/email.vo';
import { Password } from '@contexts/auth/domain/models/password.vo';

@Injectable()
export class LoginService implements LoginUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('TokenGenerator')
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponseDto> {
    const email = new Email(command.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const password = new Password(command.password);
    if (!user.verifyPassword(password)) {
      throw new Error('Invalid credentials');
    }

    const token = await this.tokenGenerator.generate(user);

    return new LoginResponseDto(token, {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
    });
  }
}
