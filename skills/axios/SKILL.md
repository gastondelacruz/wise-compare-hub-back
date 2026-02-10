---
name: axios
description: >
  HTTP client for API calls and requests in application/infrastructure layers.
  Trigger: When making HTTP requests to external APIs or internal services in application code.
license: Apache-2.0
metadata:
  author: Wise Compare Hub
  version: '1.0'
  scope: [application, infrastructure]
  auto_invoke: 'Making HTTP requests in application code'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task
---

## ⚠️ CRITICAL: Always Consult Context7 MCP

**BEFORE making any HTTP requests:**

1. 🔍 Check existing HTTP clients in `src/contexts/*/infrastructure/`
2. 📋 Review `Context7 MCP` documentation for HTTP patterns
3. ✅ Use existing HTTP service patterns and conventions
4. 🚫 NEVER create duplicate HTTP clients or adapters

**Reference:** `Context7 MCP` contains the authoritative HTTP request patterns for this project.

---

## When to Use

Use this skill when:

- Making HTTP requests from application services
- Creating HTTP adapters in infrastructure layer
- Integrating with external APIs
- Implementing HTTP-based ports
- Adding request/response interceptors
- Handling HTTP errors and retries

---

## Critical Patterns

### Pattern 1: Injectable HTTP Service

```typescript
// ✅ CORRECT - HTTP service as injectable
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ProductApiClient {
  private httpClient: AxiosInstance;

  constructor(@Inject('API_BASE_URL') private baseUrl: string) {
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
    });
  }

  async getProduct(id: string): Promise<ProductDto> {
    try {
      const response = await this.httpClient.get<ProductDto>(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw new ExternalApiError(`Failed to fetch product: ${error.message}`);
    }
  }

  async createProduct(data: CreateProductDto): Promise<ProductDto> {
    const response = await this.httpClient.post<ProductDto>('/products', data);
    return response.data;
  }
}
```

### Pattern 2: Typed Request/Response

```typescript
// ✅ CORRECT - Type-safe HTTP requests
interface ProductDto {
  id: string;
  name: string;
  price: number;
}

interface CreateProductDto {
  name: string;
  price: number;
}

async function fetchProduct(id: string): Promise<ProductDto> {
  const response = await axios.get<ProductDto>(`/api/products/${id}`);
  return response.data;
}

async function createProduct(data: CreateProductDto): Promise<ProductDto> {
  const response = await axios.post<ProductDto>('/api/products', data);
  return response.data;
}
```

### Pattern 3: Error Handling

```typescript
// ✅ CORRECT - Proper error handling
async function getProduct(id: string) {
  try {
    const response = await axios.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new ProductNotFoundError();
      }
      if (error.response?.status === 500) {
        throw new ExternalServiceError();
      }
    }
    throw new UnknownError(error.message);
  }
}
```

### Pattern 4: Request Configuration

```typescript
// ✅ CORRECT - Configured axios instance
const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
});

// Add interceptor for all requests
apiClient.interceptors.request.use((config) => {
  console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Add interceptor for responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`[HTTP Error] ${error.message}`);
    return Promise.reject(error);
  },
);
```

---

## Decision Tree

```
Need to make HTTP request?
  ├─ External API call?
  │  └─ Create typed HTTP client
  │     → Handle errors properly
  │     → Add logging/interceptors
  │
  ├─ Internal service call?
  │  └─ Use existing client or create new service
  │
  └─ Testing HTTP requests?
     └─ Mock axios in tests
        → Use jest.mock('axios')
        → Mock specific endpoints
```

---

## Common Patterns

### Basic Request

```typescript
// GET request
const response = await axios.get('/api/products');

// POST request
const response = await axios.post('/api/products', {
  name: 'Product',
  price: 100,
});

// PUT request
const response = await axios.put(`/api/products/${id}`, updatedData);

// DELETE request
await axios.delete(`/api/products/${id}`);
```

### Query Parameters

```typescript
// Method 1: params option
const response = await axios.get('/api/products', {
  params: {
    page: 1,
    limit: 10,
  },
});

// Method 2: URL string
const response = await axios.get('/api/products?page=1&limit=10');
```

### Headers

```typescript
const response = await axios.get('/api/products', {
  headers: {
    Authorization: `Bearer ${token}`,
    'Custom-Header': 'value',
  },
});
```

### Timeout & Retry

```typescript
const response = await axios.get('/api/products', {
  timeout: 5000, // 5 seconds
});

// Retry logic
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## Testing HTTP Requests

```typescript
// ✅ CORRECT - Mock axios in tests
describe('ProductApiClient', () => {
  let client: ProductApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch product', async () => {
    const mockResponse = { data: { id: '1', name: 'Laptop' } };
    jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

    const result = await client.getProduct('1');

    expect(result).toEqual(mockResponse.data);
    expect(axios.get).toHaveBeenCalledWith('/products/1');
  });

  it('should handle 404 error', async () => {
    const error = new AxiosError('Not Found', '404');
    jest.spyOn(axios, 'get').mockRejectedValue(error);

    await expect(client.getProduct('999')).rejects.toThrow(
      ProductNotFoundError,
    );
  });
});
```

---

## Commands

```bash
npm install axios              # Install axios
npm install @nestjs/axios      # Install NestJS axios integration
```

---

## Best Practices

✅ **Type requests and responses** with TypeScript interfaces
✅ **Handle errors explicitly** - check status codes and error types
✅ **Use configured instances** with baseURL, timeouts, headers
✅ **Add logging/monitoring** via interceptors
✅ **Set reasonable timeouts** to prevent hanging requests
✅ **Mock in tests** - don't make real HTTP calls in tests
✅ **Handle retries** for transient failures

---

## Common Mistakes

❌ Not typing request/response data
❌ Making HTTP calls without error handling
❌ Hardcoding URLs instead of using config
❌ No timeout configuration
❌ Making real HTTP calls in unit tests
❌ Not handling network errors
❌ Creating new axios instances per request

---

## Integration with NestJS

```typescript
// ✅ CORRECT - NestJS HttpModule integration
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProductApiClient } from './adapters/product-api.client';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [ProductApiClient],
  exports: [ProductApiClient],
})
export class ApiModule {}
```

---

## Resources

- [Axios Documentation](https://axios-http.com/)
- [NestJS HttpModule](https://docs.nestjs.com/techniques/http-module)
- [HTTP Best Practices](https://restfulapi.net/)
- [Error Handling Guide](https://axios-http.com/docs/handling_errors)
