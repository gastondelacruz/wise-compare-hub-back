import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new (await import('@nestjs/common')).ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/products/search', () => {
    it('should return all products when no filters applied', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('products');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('totalPages');
          expect(Array.isArray(res.body.products)).toBe(true);
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(20);
        });
    });

    it('should filter by text query', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ q: 'laptop' })
        .expect(200)
        .expect((res) => {
          expect(res.body.products.length).toBeGreaterThan(0);
          expect(
            res.body.products.every((p: { name: string }) =>
              p.name.toLowerCase().includes('laptop'),
            ),
          ).toBe(true);
        });
    });

    it('should filter by minPrice', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ minPrice: 1000 })
        .expect(200)
        .expect((res) => {
          expect(
            res.body.products.every((p: { price: number }) => p.price >= 1000),
          ).toBe(true);
        });
    });

    it('should filter by maxPrice', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ maxPrice: 100 })
        .expect(200)
        .expect((res) => {
          expect(
            res.body.products.every((p: { price: number }) => p.price <= 100),
          ).toBe(true);
        });
    });

    it('should filter by price range', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ minPrice: 100, maxPrice: 500 })
        .expect(200)
        .expect((res) => {
          expect(
            res.body.products.every(
              (p: { price: number }) => p.price >= 100 && p.price <= 500,
            ),
          ).toBe(true);
        });
    });

    it('should filter by single source', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ sources: ['amazon'] })
        .expect(200)
        .expect((res) => {
          expect(
            res.body.products.every(
              (p: { source: string }) => p.source === 'amazon',
            ),
          ).toBe(true);
        });
    });

    it('should filter by multiple sources', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ sources: ['amazon', 'mercadolibre'] })
        .expect(200)
        .expect((res) => {
          expect(
            res.body.products.every((p: { source: string }) =>
              ['amazon', 'mercadolibre'].includes(p.source),
            ),
          ).toBe(true);
        });
    });

    it('should sort by price-low', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ sort: 'price-low' })
        .expect(200)
        .expect((res) => {
          const prices = res.body.products.map(
            (p: { price: number }) => p.price,
          );
          const sortedPrices = [...prices].sort((a, b) => a - b);
          expect(prices).toEqual(sortedPrices);
        });
    });

    it('should sort by price-high', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ sort: 'price-high' })
        .expect(200)
        .expect((res) => {
          const prices = res.body.products.map(
            (p: { price: number }) => p.price,
          );
          const sortedPrices = [...prices].sort((a, b) => b - a);
          expect(prices).toEqual(sortedPrices);
        });
    });

    it('should paginate results', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ page: 1, limit: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.products.length).toBeLessThanOrEqual(5);
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(5);
        });
    });

    it('should paginate to second page', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ page: 2, limit: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(2);
          expect(res.body.limit).toBe(5);
        });
    });

    it('should combine all filters', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({
          q: 'laptop',
          minPrice: 800,
          maxPrice: 1300,
          sources: ['amazon', 'mercadolibre'],
          sort: 'price-low',
          page: 1,
          limit: 10,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.products.length).toBeGreaterThan(0);
          expect(
            res.body.products.every(
              (p: { name: string; price: number; source: string }) => {
                return (
                  p.name.toLowerCase().includes('laptop') &&
                  p.price >= 800 &&
                  p.price <= 1300 &&
                  ['amazon', 'mercadolibre'].includes(p.source)
                );
              },
            ),
          ).toBe(true);
          const prices = res.body.products.map(
            (p: { price: number }) => p.price,
          );
          const sortedPrices = [...prices].sort((a, b) => a - b);
          expect(prices).toEqual(sortedPrices);
        });
    });

    it('should return default pagination when not specified', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(20);
        });
    });

    it('should validate minPrice is not negative', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ minPrice: -10 })
        .expect(400);
    });

    it('should validate maxPrice is not negative', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ maxPrice: -10 })
        .expect(400);
    });

    it('should validate page is at least 1', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ page: 0 })
        .expect(400);
    });

    it('should validate limit is at least 1', () => {
      return request(app.getHttpServer())
        .get('/api/products/search')
        .query({ limit: 0 })
        .expect(400);
    });
  });

  describe('GET /api/products/:productId', () => {
    it('should return product by id', () => {
      return request(app.getHttpServer())
        .get('/api/products/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('price');
          expect(res.body).toHaveProperty('source');
          expect(res.body.id).toBe('1');
        });
    });

    it('should return 404 when product not found', () => {
      return request(app.getHttpServer())
        .get('/api/products/non-existent-id')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe('Product not found');
        });
    });

    it('should return product with all fields', () => {
      return request(app.getHttpServer())
        .get('/api/products/1')
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.id).toBe('string');
          expect(typeof res.body.name).toBe('string');
          expect(typeof res.body.price).toBe('number');
          expect(typeof res.body.source).toBe('string');
        });
    });
  });
});
