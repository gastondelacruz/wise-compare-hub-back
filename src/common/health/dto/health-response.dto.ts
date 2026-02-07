import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Health status',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    description: 'Timestamp in ISO 8601 format',
    example: '2026-02-07T12:00:00.000Z',
  })
  timestamp: string;

  static ok(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
