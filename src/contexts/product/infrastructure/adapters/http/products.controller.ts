import {
  Controller,
  Get,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchProductsUseCase } from '@contexts/product/application/ports/input/search-products-use-case';
import { SearchProductsQuery } from '@contexts/product/application/dto/search-products-query';
import { SearchProductsDto } from './dto/search-products.dto';
import { SearchProductsResponseDto } from './dto/search-products-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    @Inject('SearchProductsUseCase')
    private readonly searchProductsUseCase: SearchProductsUseCase,
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
}
