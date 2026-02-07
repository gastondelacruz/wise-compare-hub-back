import { Module } from '@nestjs/common';
import { InMemoryOfferRepository } from './adapters/persistence/in-memory-offer.repository';

@Module({
  providers: [
    {
      provide: 'OfferRepository',
      useClass: InMemoryOfferRepository,
    },
  ],
  exports: ['OfferRepository'],
})
export class OfferModule {}
