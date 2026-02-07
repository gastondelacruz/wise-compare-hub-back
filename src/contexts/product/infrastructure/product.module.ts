import { Module } from '@nestjs/common';
import { ProductsController } from './adapters/http/products.controller';
import { SearchProductsService } from '@contexts/product/application/use-cases/search-products.service';
import { GetProductOffersService } from '@contexts/product/application/use-cases/get-product-offers.service';
import { InMemoryProductRepository } from './adapters/persistence/in-memory-product.repository';
import { OfferModule } from '@contexts/offer/infrastructure/offer.module';

@Module({
  imports: [OfferModule],
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
      provide: 'ProductRepository',
      useClass: InMemoryProductRepository,
    },
  ],
})
export class ProductModule {}
