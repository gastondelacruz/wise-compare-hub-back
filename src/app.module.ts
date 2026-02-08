import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@contexts/auth/infrastructure/auth.module';
import { ProductModule } from '@contexts/product/infrastructure/product.module';
import { VendorModule } from '@contexts/vendor/infrastructure/vendor.module';
import { OfferModule } from '@contexts/offer/infrastructure/offer.module';
import { HealthModule } from '@common/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    ProductModule,
    VendorModule,
    OfferModule,
    HealthModule,
  ],
})
export class AppModule {}
