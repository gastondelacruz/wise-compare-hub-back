import { Module, forwardRef } from '@nestjs/common';
import { ProductsController } from './adapters/http/products.controller';
import { SearchProductsService } from '@contexts/product/application/use-cases/search-products.service';
import { GetProductOffersService } from '@contexts/product/application/use-cases/get-product-offers.service';
import { GetRecentSearchesService } from '@contexts/product/application/use-cases/get-recent-searches.service';
import { InMemoryProductRepository } from './adapters/persistence/in-memory-product.repository';
import { InMemoryRecentSearchRepository } from './adapters/persistence/in-memory-recent-search.repository';
import { OfferModule } from '@contexts/offer/infrastructure/offer.module';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@Module({
  imports: [forwardRef(() => OfferModule)],
  controllers: [ProductsController],
  providers: [
    {
      provide: 'SearchProductsUseCase',
      useClass: SearchProductsService,
    },
    {
      provide: 'GetProductOffersUseCase',
      useClass: GetProductOffersService,
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
  exports: [
    'ProductRepository', // Export so other modules can use the same singleton instance
    'RecentSearchRepository',
  ],
})
export class ProductModule {}
