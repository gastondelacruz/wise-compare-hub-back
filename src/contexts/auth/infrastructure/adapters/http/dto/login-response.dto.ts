import { ApiProperty } from '@nestjs/swagger';
import { LoginResponseDto as ApplicationLoginResponseDto } from '@contexts/auth/application/dto/login-response.dto';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT token',
    example:
      'mock-jwt-eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ==',
  })
  readonly token: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    },
  })
  readonly user: {
    id: string;
    email: string;
    name?: string;
  };

  static fromApplication(dto: ApplicationLoginResponseDto): LoginResponseDto {
    return {
      token: dto.token,
      user: dto.user,
    };
  }
}
