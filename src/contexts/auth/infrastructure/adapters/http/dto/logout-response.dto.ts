import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout success status',
    example: true,
  })
  readonly success: boolean;

  static success(): LogoutResponseDto {
    return { success: true };
  }
}
