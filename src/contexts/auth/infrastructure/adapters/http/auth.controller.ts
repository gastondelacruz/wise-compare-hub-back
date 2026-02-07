import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginUseCase } from '@contexts/auth/application/ports/input/login-use-case';
import { LoginCommand } from '@contexts/auth/application/dto/login-command';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('LoginUseCase')
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing or invalid fields',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials',
  })
  async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    try {
      const command = new LoginCommand(dto.email, dto.password);
      const result = await this.loginUseCase.execute(command);

      return {
        token: result.token,
        user: result.user,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          throw new UnauthorizedException('Invalid credentials');
        }
        if (
          error.message.includes('cannot be empty') ||
          error.message.includes('Invalid email format')
        ) {
          throw new BadRequestException(error.message);
        }
      }
      throw error;
    }
  }
}
