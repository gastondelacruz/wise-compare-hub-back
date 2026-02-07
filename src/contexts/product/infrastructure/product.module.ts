import { Module } from '@nestjs/common';
import { ProductsController } from './adapters/http/products.controller';
import { SearchProductsService } from '@contexts/product/application/use-cases/search-products.service';
import { InMemoryProductRepository } from './adapters/persistence/in-memory-product.repository';
import { InMemoryOfferRepository } from './adapters/persistence/in-memory-offer.repository';

@Module({
  controllers: [ProductsController],
  providers: [
    {
      provide: 'SearchProductsUseCase',
      useClass: SearchProductsService,
    },
    {
      provide: 'ProductRepository',
      useClass: InMemoryProductRepository,
    },
    {
      provide: 'OfferRepository',
      useClass: InMemoryOfferRepository,
    },
  ],
})
export class ProductModule {}
