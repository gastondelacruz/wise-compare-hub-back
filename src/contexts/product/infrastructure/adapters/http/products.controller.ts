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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SearchProductsUseCase } from '@contexts/product/application/ports/input/search-products-use-case';
import { GetProductByIdUseCase } from '@contexts/product/application/ports/input/get-product-by-id-use-case';
import { SearchProductsQuery } from '@contexts/product/application/dto/search-products-query';
import { SearchProductsDto } from './dto/search-products.dto';
import {
  SearchProductsResponseDto,
  ProductResponseDto,
} from './dto/search-products-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    @Inject('SearchProductsUseCase')
    private readonly searchProductsUseCase: SearchProductsUseCase,
    @Inject('GetProductByIdUseCase')
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search products with filters and pagination' })
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
