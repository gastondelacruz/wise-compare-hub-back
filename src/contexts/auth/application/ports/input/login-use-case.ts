import { LoginCommand } from '../../dto/login-command';
import { LoginResponseDto } from '../../dto/login-response.dto';

export interface LoginUseCase {
  execute(command: LoginCommand): Promise<LoginResponseDto>;
}
