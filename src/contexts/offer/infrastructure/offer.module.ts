import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { InMemoryOfferRepository } from './adapters/persistence/in-memory-offer.repository';
import { MercadoLibreOfferProvider } from './adapters/vendors/mercado-libre/mercado-libre-offer-provider';
import { IngestOffersService } from '@contexts/offer/application/use-cases/ingest-offers.service';
import { OffersQueryService } from '@contexts/offer/application/use-cases/offers-query.service';
import { RequestOffersFetchService } from '@contexts/offer/application/use-cases/request-offers-fetch.service';
import { GetOffersService } from '@contexts/offer/application/use-cases/get-offers.service';
import { VendorOfferProvider } from '@contexts/offer/application/ports/output/vendor-offer-provider';
import { SimpleEventBus } from './adapters/events/simple-event-bus';
import { MercadoLibreOffersFetchHandler } from './adapters/events/handlers/mercado-libre-offers-fetch.handler';
import { OffersController } from './adapters/http/offers.controller';
import { VendorModule } from '@contexts/vendor/infrastructure/vendor.module';
import { ProductModule } from '@contexts/product/infrastructure/product.module';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    VendorModule,
    forwardRef(() => ProductModule), // Import ProductModule to get shared ProductRepository
  ],
  controllers: [OffersController],
  providers: [
    {
      provide: 'OfferRepository',
      useClass: InMemoryOfferRepository,
    },
    // ProductRepository is now provided by ProductModule (imported above)
    MercadoLibreOfferProvider,
    {
      provide: 'VendorOfferProviders',
      useFactory: (mercadoLibreProvider: MercadoLibreOfferProvider) => {
        return [mercadoLibreProvider] as VendorOfferProvider[];
      },
      inject: [MercadoLibreOfferProvider],
    },
    {
      provide: 'IngestOffersUseCase',
      useClass: IngestOffersService,
    },
    {
      provide: 'OffersQueryUseCase',
      useClass: OffersQueryService,
    },
    {
      provide: 'RequestOffersFetchUseCase',
      useClass: RequestOffersFetchService,
    },
    {
      provide: 'GetOffersUseCase',
      useClass: GetOffersService,
    },
    SimpleEventBus,
    {
      provide: 'EventBus',
      useExisting: SimpleEventBus,
    },
    MercadoLibreOffersFetchHandler,
    JwtAuthGuard,
  ],
  exports: [
    'OfferRepository',
    MercadoLibreOfferProvider,
    'IngestOffersUseCase',
    'OffersQueryUseCase',
    'RequestOffersFetchUseCase',
    'GetOffersUseCase',
    'EventBus',
  ],
})
export class OfferModule implements OnModuleInit {
  constructor(
    private readonly eventBus: SimpleEventBus,
    private readonly mercadoLibreHandler: MercadoLibreOffersFetchHandler,
  ) {}

  onModuleInit(): void {
    // Register handler for OffersFetchRequested events
    this.eventBus.registerHandler(
      'OffersFetchRequested',
      this.mercadoLibreHandler,
    );
  }
}
