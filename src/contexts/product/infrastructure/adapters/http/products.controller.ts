import {
  Controller,
  Get,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchProductsUseCase } from '@contexts/product/application/ports/input/search-products-use-case';
import { GetRecentSearchesUseCase } from '@contexts/product/application/ports/input/get-recent-searches-use-case';
import { SearchProductsQuery } from '@contexts/product/application/dto/search-products-query';
import { SearchProductsDto } from './dto/search-products.dto';
import { SearchProductsResponseDto } from './dto/search-products-response.dto';
import { RecentSearchResponseDto } from './dto/recent-searches-response.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    @Inject('SearchProductsUseCase')
    private readonly searchProductsUseCase: SearchProductsUseCase,
    @Inject('GetRecentSearchesUseCase')
    private readonly getRecentSearchesUseCase: GetRecentSearchesUseCase,
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
    @CurrentUser() userId?: string,
  ): Promise<SearchProductsResponseDto> {
    const query = SearchProductsQuery.fromDto(dto, userId);
    const result = await this.searchProductsUseCase.execute(query);
    return SearchProductsResponseDto.fromApplication(result);
  }

  @Get('recent-searches')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get recent searches',
    description:
      'Returns recent searches for the authenticated user if token is provided, otherwise returns global recent searches. Maximum 10 results.',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent searches found',
    type: [RecentSearchResponseDto],
  })
  async getRecentSearches(
    @CurrentUser() userId?: string,
  ): Promise<RecentSearchResponseDto[]> {
    const recentSearches = await this.getRecentSearchesUseCase.execute(userId);
    return RecentSearchResponseDto.fromDomainArray(recentSearches);
  }
}
