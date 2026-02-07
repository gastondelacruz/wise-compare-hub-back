import {
  Controller,
  Get,
  Query,
  Param,
  Inject,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
import { Token } from '@contexts/auth/infrastructure/adapters/http/decorators/token.decorator';
import { TokenDecoderService } from './token-decoder.service';
import { RecentSearchRepository } from '@contexts/product/application/ports/output/recent-search.repository';
import { UserId } from '@contexts/auth/domain/models/user-id.vo';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    @Inject('SearchProductsUseCase')
    private readonly searchProductsUseCase: SearchProductsUseCase,
    @Inject('GetProductByIdUseCase')
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    @Inject('GetRecentSearchesUseCase')
    private readonly getRecentSearchesUseCase: GetRecentSearchesUseCase,
    @Inject('RecentSearchRepository')
    private readonly recentSearchRepository: RecentSearchRepository,
    private readonly tokenDecoder: TokenDecoderService,
  ) {}

  @Get('recent-searches')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent search queries for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Recent searches retrieved',
    type: RecentSearchesResponseDto,
  })
  async getRecentSearches(
    @Token() token: string | null,
  ): Promise<RecentSearchesResponseDto> {
    const userId = this.tokenDecoder.decodeUserId(token);
    const searches = await this.getRecentSearchesUseCase.execute(userId);

    return {
      searches,
    };
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search products with filters and pagination',
    description:
      'Searches products with optional filters. If authenticated and q parameter is provided, the search query will be saved to recent searches.',
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
    @Token() token: string | null,
  ): Promise<SearchProductsResponseDto> {
    let sourcesArray: string[] | undefined;
    if (dto.sources) {
      if (Array.isArray(dto.sources)) {
        sourcesArray = dto.sources;
      } else if (typeof dto.sources === 'string') {
        sourcesArray = [dto.sources];
      }
    }

    const query = new SearchProductsQuery(
      dto.q,
      dto.minPrice,
      dto.maxPrice,
      sourcesArray,
      dto.sort,
      dto.page ? Number(dto.page) : undefined,
      dto.limit ? Number(dto.limit) : undefined,
    );

    const result = await this.searchProductsUseCase.execute(query);

    if (dto.q) {
      const userId = this.tokenDecoder.decodeUserId(token);
      if (userId) {
        await this.recentSearchRepository.save(new UserId(userId), dto.q);
      }
    }

    return {
      products: result.products.map((product) => ({
        id: product.id.value,
        name: product.name.value,
        price: product.price.value,
        source: product.source.value,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
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
    try {
      const product = await this.getProductByIdUseCase.execute(productId);

      return {
        id: product.id.value,
        name: product.name.value,
        price: product.price.value,
        source: product.source.value,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}
