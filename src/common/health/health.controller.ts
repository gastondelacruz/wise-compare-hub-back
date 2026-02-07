import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns the server health status',
  })
  @ApiResponse({
    status: 200,
    description: 'Server is healthy',
    type: HealthResponseDto,
  })
  check(): HealthResponseDto {
    return HealthResponseDto.ok();
  }
}
