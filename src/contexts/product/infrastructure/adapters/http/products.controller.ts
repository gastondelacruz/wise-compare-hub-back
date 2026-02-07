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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SearchProductsUseCase } from '@contexts/product/application/ports/input/search-products-use-case';
import { GetProductByIdUseCase } from '@contexts/product/application/ports/input/get-product-by-id-use-case';
import { GetRecentSearchesUseCase } from '@contexts/product/application/ports/input/get-recent-searches-use-case';
import { SearchProductsQuery } from '@contexts/product/application/dto/search-products-query';
import { SearchProductsDto } from './dto/search-products.dto';
import {
  SearchProductsResponseDto,
  ProductResponseDto,
} from './dto/search-products-response.dto';
import { RecentSearchesResponseDto } from './dto/recent-searches-response.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    @Inject('SearchProductsUseCase')
    private readonly searchProductsUseCase: SearchProductsUseCase,
    @Inject('GetProductByIdUseCase')
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    @Inject('GetRecentSearchesUseCase')
    private readonly getRecentSearchesUseCase: GetRecentSearchesUseCase,
  ) {}

  @Get('recent-searches')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get recent search queries',
    description:
      'Returns recent searches for authenticated user if token is provided, otherwise returns global recent searches. Maximum 10 searches.',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent searches retrieved',
    type: RecentSearchesResponseDto,
  })
  async getRecentSearches(
    @CurrentUser() userId?: string,
  ): Promise<RecentSearchesResponseDto> {
    const searches = await this.getRecentSearchesUseCase.execute(
      userId || null,
    );
    return RecentSearchesResponseDto.fromDomain(searches);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search products with filters and pagination',
    description:
      'Searches products with optional filters. If q parameter is provided and results are found, the search query will be saved to recent searches (user-specific if authenticated, global otherwise).',
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

  @Get(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getById(
    @Param('productId') productId: string,
  ): Promise<ProductResponseDto> {
    const product = await this.getProductByIdUseCase.execute(productId);
    return ProductResponseDto.fromDomain(product);
  }
}
