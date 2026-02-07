import { IsString, IsEmail, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({
    description: 'User email',
    example: 'test@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsString()
  readonly email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 1,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(1, { message: 'Password cannot be empty' })
  readonly password: string;
}
