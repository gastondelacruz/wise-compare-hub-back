import { Module } from '@nestjs/common';
import { VendorsController } from './adapters/http/vendors.controller';
import { GetVendorsService } from '@contexts/vendor/application/use-cases/get-vendors.service';
import { InMemoryVendorRepository } from './adapters/persistence/in-memory-vendor.repository';

@Module({
  controllers: [VendorsController],
  providers: [
    {
      provide: 'GetVendorsUseCase',
      useClass: GetVendorsService,
    },
    {
      provide: 'VendorRepository',
      useClass: InMemoryVendorRepository,
    },
  ],
  exports: ['VendorRepository'],
})
export class VendorModule {}
