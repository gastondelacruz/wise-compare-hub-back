import { Injectable } from '@nestjs/common';
import { ProductRepository } from '@contexts/product/application/ports/output/product.repository';
import { Product } from '@contexts/product/domain/models/product.entity';
import { ProductId } from '@contexts/product/domain/models/product-id.vo';
import { ProductName } from '@contexts/product/domain/models/product-name.vo';
import { Price } from '@contexts/product/domain/models/price.vo';
import { Source } from '@contexts/product/domain/models/source.vo';

@Injectable()
export class InMemoryProductRepository implements ProductRepository {
  private readonly products: Product[];

  constructor() {
    this.products = this.getDefaultProducts();
  }

  findAll(): Promise<Product[]> {
    return Promise.resolve([...this.products]);
  }

  findById(id: ProductId): Promise<Product | null> {
    const product = this.products.find((p) => p.id.value === id.value);
    return Promise.resolve(product ?? null);
  }

  private getDefaultProducts(): Product[] {
    return [
      new Product(
        new ProductId('1'),
        new ProductName('Laptop Dell XPS 15'),
        new Price(1299.99),
        new Source('amazon'),
      ),
      new Product(
        new ProductId('2'),
        new ProductName('Laptop HP Pavilion'),
        new Price(899.99),
        new Source('mercadolibre'),
      ),
      new Product(
        new ProductId('3'),
        new ProductName('Mouse Logitech MX Master'),
        new Price(79.99),
        new Source('amazon'),
      ),
      new Product(
        new ProductId('4'),
        new ProductName('Keyboard Mechanical'),
        new Price(149.99),
        new Source('falabella'),
      ),
      new Product(
        new ProductId('5'),
        new ProductName('Monitor LG 27 pulgadas'),
        new Price(299.99),
        new Source('amazon'),
      ),
      new Product(
        new ProductId('6'),
        new ProductName('Laptop Lenovo ThinkPad'),
        new Price(1199.99),
        new Source('mercadolibre'),
      ),
      new Product(
        new ProductId('7'),
        new ProductName('Mouse Inalámbrico'),
        new Price(25.99),
        new Source('falabella'),
      ),
      new Product(
        new ProductId('8'),
        new ProductName('Teclado RGB Gaming'),
        new Price(89.99),
        new Source('amazon'),
      ),
    ];
  }
}
