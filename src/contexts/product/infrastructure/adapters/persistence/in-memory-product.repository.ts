import { Injectable } from '@nestjs/common';
import { ProductRepository } from '@contexts/product/application/ports/output/product.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';

@Injectable()
export class InMemoryProductRepository implements ProductRepository {
  private products: Product[] = [];

  constructor() {
    // Start empty - products will be created dynamically when offers are ingested
    // from real vendor searches (MercadoLibre scraper)
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
