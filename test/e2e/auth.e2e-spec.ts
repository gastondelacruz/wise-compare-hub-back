import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
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

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email');
          expect(res.body.user.email).toBe('test@example.com');
          expect(typeof res.body.token).toBe('string');
        });
    });

    it('should return 401 with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });

    it('should return 401 with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should return 400 when email format is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should login with admin user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.user.email).toBe('admin@example.com');
          expect(res.body.user.name).toBe('Admin User');
        });
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get a valid token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      authToken = loginResponse.body.token as string;
    });

    it('should logout successfully with valid token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should return 401 when token is missing', () => {
      return request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });

    it('should return 401 when token is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 when token format is incorrect', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    it('should invalidate token after logout', async () => {
      // First logout
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to logout again with same token - should fail
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });
});
