import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '@contexts/auth/application/ports/input/login-use-case';
import { LogoutUseCase } from '@contexts/auth/application/ports/input/logout-use-case';
import { LoginCommand } from '@contexts/auth/application/dto/login-command';
import { LoginResponseDto as AppLoginResponseDto } from '@contexts/auth/application/dto/login-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockLoginUseCase: jest.Mocked<LoginUseCase>;
  let mockLogoutUseCase: jest.Mocked<LogoutUseCase>;

  beforeEach(async () => {
    mockLoginUseCase = {
      execute: jest.fn(),
    };
    mockLogoutUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: 'LoginUseCase',
          useValue: mockLoginUseCase,
        },
        {
          provide: 'LogoutUseCase',
          useValue: mockLogoutUseCase,
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

  it('should propagate error when credentials are invalid', async () => {
    mockLoginUseCase.execute.mockRejectedValue(
      new Error('Invalid credentials'),
    );

    await expect(
      controller.login({
        email: 'test@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid credentials');
  });

  describe('logout', () => {
    it('should logout successfully with valid token', async () => {
      mockLogoutUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.logout('valid-token');

      expect(result.success).toBe(true);
      expect(mockLogoutUseCase.execute).toHaveBeenCalledWith('valid-token');
    });

    it('should propagate error when token is missing', async () => {
      mockLogoutUseCase.execute.mockRejectedValue(
        new Error('Token cannot be empty'),
      );

      await expect(controller.logout(null)).rejects.toThrow(
        'Token cannot be empty',
      );
    });

    it('should propagate error when token is invalid', async () => {
      mockLogoutUseCase.execute.mockRejectedValue(
        new Error('Invalid or expired token'),
      );

      await expect(controller.logout('invalid-token')).rejects.toThrow(
        'Invalid or expired token',
      );
    });
  });
});
