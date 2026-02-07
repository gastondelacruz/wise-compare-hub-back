import { ApiProperty } from '@nestjs/swagger';
import { Product } from '@contexts/product/domain/models/product.entity';
import { SearchProductsResponseDto as ApplicationSearchProductsResponseDto } from '@contexts/product/application/dto/search-products-response.dto';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  source: string;

  static fromDomain(product: Product): ProductResponseDto {
    return {
      id: product.id.value,
      name: product.name.value,
      price: product.price.value,
      source: product.source.value,
    };
  }
}

export class SearchProductsResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  static fromApplication(
    dto: ApplicationSearchProductsResponseDto,
  ): SearchProductsResponseDto {
    return {
      products: dto.products.map((product) =>
        ProductResponseDto.fromDomain(product),
      ),
      total: dto.total,
      page: dto.page,
      limit: dto.limit,
      totalPages: dto.totalPages,
    };
  }
}
