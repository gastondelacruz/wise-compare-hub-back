import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { GetProductByIdUseCase } from '../ports/input/get-product-by-id-use-case';
import { ProductRepository } from '../ports/output/product.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';

@Injectable()
export class GetProductByIdService implements GetProductByIdUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(productId: string): Promise<Product> {
    const id = new ProductId(productId);
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
