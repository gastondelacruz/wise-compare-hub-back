import { Module } from '@nestjs/common';
import { ProductsController } from './adapters/http/products.controller';
import { SearchProductsService } from '@contexts/product/application/use-cases/search-products.service';
import { GetProductByIdService } from '@contexts/product/application/use-cases/get-product-by-id.service';
import { GetRecentSearchesService } from '@contexts/product/application/use-cases/get-recent-searches.service';
import { InMemoryProductRepository } from './adapters/persistence/in-memory-product.repository';
import { InMemoryRecentSearchRepository } from './adapters/persistence/in-memory-recent-search.repository';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@Module({
  controllers: [ProductsController],
  providers: [
    {
      provide: 'SearchProductsUseCase',
      useClass: SearchProductsService,
    },
    {
      provide: 'GetProductByIdUseCase',
      useClass: GetProductByIdService,
    },
    {
      provide: 'GetRecentSearchesUseCase',
      useClass: GetRecentSearchesService,
    },
    {
      provide: 'ProductRepository',
      useClass: InMemoryProductRepository,
    },
    {
      provide: 'RecentSearchRepository',
      useClass: InMemoryRecentSearchRepository,
    },
    JwtAuthGuard,
  ],
})
export class ProductModule {}
