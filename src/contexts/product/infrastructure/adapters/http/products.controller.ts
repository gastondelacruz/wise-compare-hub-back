import {
  Controller,
  Get,
  Query,
  Param,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SearchProductsUseCase } from '@contexts/product/application/ports/input/search-products-use-case';
import { GetProductOffersUseCase } from '@contexts/product/application/ports/input/get-product-offers-use-case';
import { SearchProductsQuery } from '@contexts/product/application/dto/search-products-query';
import { SearchProductsDto } from './dto/search-products.dto';
import { SearchProductsResponseDto } from './dto/search-products-response.dto';
import { GetProductOffersDto } from './dto/get-product-offers.dto';
import { GetProductOffersResponseDto } from './dto/get-product-offers-response.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    @Inject('SearchProductsUseCase')
    private readonly searchProductsUseCase: SearchProductsUseCase,
    @Inject('GetProductOffersUseCase')
    private readonly getProductOffersUseCase: GetProductOffersUseCase,
  ) {}

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search canonical products with aggregated offers',
    description:
      'Searches for canonical products grouped by canonicalProductId, with aggregated offer information including price ranges, best prices, and delivery times.',
  })
  @ApiResponse({
    status: 200,
    description: 'Products found',
    type: SearchProductsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid query parameters',
  })
  async search(
    @Query() dto: SearchProductsDto,
  ): Promise<SearchProductsResponseDto> {
    const query = SearchProductsQuery.fromDto(dto);
    const result = await this.searchProductsUseCase.execute(query);
    return SearchProductsResponseDto.fromApplication(result);
  }

  @Get(':canonicalProductId/offers')
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
    @Query() dto: GetProductOffersDto,
    @CurrentUser() userId?: string,
  ): Promise<GetProductOffersResponseDto> {
    const result = await this.getProductOffersUseCase.execute(
      canonicalProductId,
      dto.sort,
      dto.vendors,
      dto.preferences,
      userId,
    );
    return GetProductOffersResponseDto.fromApplication(result);
  }
}
