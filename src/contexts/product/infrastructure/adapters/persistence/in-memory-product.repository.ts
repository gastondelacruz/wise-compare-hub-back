import { Injectable, Logger } from '@nestjs/common';
import { ProductRepository } from '@contexts/product/application/ports/output/product.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';

@Injectable()
export class InMemoryProductRepository implements ProductRepository {
  private readonly logger = new Logger(InMemoryProductRepository.name);
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
    const results = this.products.filter((p) =>
      p.name.toLowerCase().includes(term),
    );
    this.logger.log(
      `🔍 Searching for "${searchTerm}" - Found ${results.length} products (Total in DB: ${this.products.length})`,
    );
    if (this.products.length > 0) {
      this.logger.log(
        `   Available products: ${this.products.map((p) => `"${p.name}"`).join(', ')}`,
      );
    }
    return Promise.resolve(results);
  }

  save(product: Product): Promise<void> {
    const index = this.products.findIndex(
      (p) => p.id.value === product.id.value,
    );
    if (index >= 0) {
      this.logger.log(`📝 Updated product: ${product.name}`);
      this.products[index] = product;
    } else {
      this.logger.log(
        `➕ Created new product: ${product.name} (total: ${this.products.length + 1})`,
      );
      this.products.push(product);
    }
    return Promise.resolve();
  }
}
