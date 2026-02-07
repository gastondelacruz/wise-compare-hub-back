import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '@contexts/auth/application/ports/input/login-use-case';
import { LoginCommand } from '@contexts/auth/application/dto/login-command';
import { LoginResponseDto as AppLoginResponseDto } from '@contexts/auth/application/dto/login-response.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockLoginUseCase: jest.Mocked<LoginUseCase>;

  beforeEach(async () => {
    mockLoginUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: 'LoginUseCase',
          useValue: mockLoginUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should login successfully with valid credentials', async () => {
    const responseDto = new AppLoginResponseDto('mock-token', {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    });

    mockLoginUseCase.execute.mockResolvedValue(responseDto);

    const result = await controller.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.token).toBe('mock-token');
    expect(result.user.id).toBe('user-1');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test User');
    expect(mockLoginUseCase.execute).toHaveBeenCalledWith(
      expect.any(LoginCommand),
    );
  });

  it('should throw UnauthorizedException when credentials are invalid', async () => {
    mockLoginUseCase.execute.mockRejectedValue(
      new Error('Invalid credentials'),
    );

    await expect(
      controller.login({
        email: 'test@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
