import { ApiProperty } from '@nestjs/swagger';

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
}
