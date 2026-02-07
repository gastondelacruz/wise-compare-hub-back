import {
  Controller,
  Get,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetVendorsUseCase } from '@contexts/vendor/application/ports/input/get-vendors-use-case';
import { GetVendorsDto } from './dto/get-vendors.dto';
import { GetVendorsResponseDto } from './dto/get-vendors-response.dto';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(
    @Inject('GetVendorsUseCase')
    private readonly getVendorsUseCase: GetVendorsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get list of available vendors',
    description:
      'Returns the complete list of vendors that can be used as filters when searching and comparing products. The frontend MUST NOT hardcode vendor names.',
  })
  @ApiResponse({
    status: 200,
    description: 'Vendors retrieved successfully',
    type: GetVendorsResponseDto,
  })
  async getVendors(
    @Query() dto: GetVendorsDto,
  ): Promise<GetVendorsResponseDto> {
    const result = await this.getVendorsUseCase.execute(dto.enabled);
    return GetVendorsResponseDto.fromApplication(result);
  }
}
