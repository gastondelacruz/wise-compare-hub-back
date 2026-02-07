import { Module } from '@nestjs/common';
import { ProductsController } from './adapters/http/products.controller';
import { SearchProductsService } from '@contexts/product/application/use-cases/search-products.service';
import { GetProductByIdService } from '@contexts/product/application/use-cases/get-product-by-id.service';
import { InMemoryProductRepository } from './adapters/persistence/in-memory-product.repository';

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
      provide: 'ProductRepository',
      useClass: InMemoryProductRepository,
    },
  ],
})
export class ProductModule {}
