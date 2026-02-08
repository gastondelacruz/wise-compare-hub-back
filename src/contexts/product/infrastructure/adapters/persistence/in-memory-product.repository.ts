import { Injectable } from '@nestjs/common';
import { ProductRepository } from '@contexts/product/application/ports/output/product.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';

@Injectable()
export class InMemoryProductRepository implements ProductRepository {
  private products: Product[] = [];

  constructor() {
    this.initializeMockProducts();
  }

  private initializeMockProducts(): void {
    const mockProducts = [
      {
        id: 'prod-1',
        canonicalId: 'apple-macbook-pro-14-m3',
        name: 'Apple MacBook Pro 14" M3',
        category: 'Laptops',
        imageUrl:
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
      },
      {
        id: 'prod-2',
        canonicalId: 'apple-macbook-pro-14-m3',
        name: 'Apple MacBook Pro 14" M3',
        category: 'Laptops',
        imageUrl:
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
      },
      {
        id: 'prod-3',
        canonicalId: 'apple-iphone-15-pro',
        name: 'Apple iPhone 15 Pro',
        category: 'Smartphones',
        imageUrl:
          'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        id: 'prod-4',
        canonicalId: 'dell-xps-15-9530',
        name: 'Dell XPS 15 9530',
        category: 'Laptops',
        imageUrl:
          'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=300&fit=crop',
      },
    ];

    mockProducts.forEach((mock) => {
      const product = new Product(
        new ProductId(mock.id),
        new CanonicalProductId(mock.canonicalId),
        mock.name,
        mock.category,
        mock.imageUrl,
      );
      this.products.push(product);
    });
  }

  findAll(): Promise<Product[]> {
    return Promise.resolve([...this.products]);
  }

  findById(id: ProductId): Promise<Product | null> {
    return Promise.resolve(
      this.products.find((p) => p.id.value === id.value) || null,
    );
  }

  findByCanonicalProductId(
    canonicalProductId: CanonicalProductId,
  ): Promise<Product[]> {
    return Promise.resolve(
      this.products.filter(
        (p) => p.canonicalProductId.value === canonicalProductId.value,
      ),
    );
  }

  findBySearchTerm(searchTerm: string): Promise<Product[]> {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      return this.findAll();
    }
    return Promise.resolve(
      this.products.filter((p) => p.name.toLowerCase().includes(term)),
    );
  }

  save(product: Product): Promise<void> {
    const index = this.products.findIndex(
      (p) => p.id.value === product.id.value,
    );
    if (index >= 0) {
      this.products[index] = product;
    } else {
      this.products.push(product);
    }
    return Promise.resolve();
  }
}
