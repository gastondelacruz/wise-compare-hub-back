import {
  Controller,
  Get,
  Query,
  Param,
  Inject,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GetOffersUseCase } from '@contexts/offer/application/ports/input/get-offers-use-case';
import { GetOffersDto } from './dto/get-offers.dto';
import { GetProductOffersResponseDto } from '@contexts/product/infrastructure/adapters/http/dto/get-product-offers-response.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@ApiTags('offers')
@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(
    @Inject('GetOffersUseCase')
    private readonly getOffersUseCase: GetOffersUseCase,
  ) {}

  @Get('products/:canonicalProductId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all offers for a canonical product',
    description:
      'Returns all offers associated with a canonical product, ready to render a comparison table. Supports filtering by vendors and sorting by price, delivery, or rating.',
  })
  @ApiParam({
    name: 'canonicalProductId',
    description: 'Canonical Product ID',
    example: 'apple-macbook-pro-14-m3',
  })
  @ApiResponse({
    status: 200,
    description: 'Offers found',
    type: GetProductOffersResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getOffers(
    @Param('canonicalProductId') canonicalProductId: string,
    @Query() dto: GetOffersDto,
    @CurrentUser() userId?: string,
  ): Promise<GetProductOffersResponseDto> {
    const result = await this.getOffersUseCase.execute(
      canonicalProductId,
      dto.sort,
      dto.vendors,
      dto.preferences,
      userId,
    );

    return GetProductOffersResponseDto.fromApplication(result);
  }
}
