import { Module } from '@nestjs/common';
import { AuthModule } from '@contexts/auth/infrastructure/auth.module';
import { ProductModule } from '@contexts/product/infrastructure/product.module';

@Module({
  imports: [AuthModule, ProductModule],
})
export class AppModule {}
