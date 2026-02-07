import { Module } from '@nestjs/common';
import { AuthModule } from '@contexts/auth/infrastructure/auth.module';
import { ProductModule } from '@contexts/product/infrastructure/product.module';
import { HealthModule } from '@common/health/health.module';

@Module({
  imports: [AuthModule, ProductModule, HealthModule],
})
export class AppModule {}
