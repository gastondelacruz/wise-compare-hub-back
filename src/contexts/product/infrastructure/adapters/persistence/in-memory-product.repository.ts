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
        imageUrl: 'https://cdn.example.com/macbook-pro-m3.jpg',
      },
      {
        id: 'prod-2',
        canonicalId: 'apple-macbook-pro-14-m3',
        name: 'Apple MacBook Pro 14" M3',
        category: 'Laptops',
        imageUrl: 'https://cdn.example.com/macbook-pro-m3.jpg',
      },
      {
        id: 'prod-3',
        canonicalId: 'apple-iphone-15-pro',
        name: 'Apple iPhone 15 Pro',
        category: 'Smartphones',
        imageUrl: 'https://cdn.example.com/iphone-15-pro.jpg',
      },
      {
        id: 'prod-4',
        canonicalId: 'dell-xps-15-9530',
        name: 'Dell XPS 15 9530',
        category: 'Laptops',
        imageUrl: 'https://cdn.example.com/dell-xps-15.jpg',
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
