import { Vendor } from '@contexts/vendor/domain/models/vendor.entity';
import { VendorId } from '@contexts/vendor/domain/models/vendor-id.vo';

/**
 * Creates the MercadoLibre vendor entity.
 * This is a constant vendor instance used by MercadoLibreOfferProvider.
 */
export function createMercadoLibreVendor(): Vendor {
  return new Vendor(
    new VendorId('mercadolibre'),
    'MercadoLibre',
    true, // isOfficial
    'https://cdn.wisecompare.com/vendors/mercadolibre.svg',
    true, // enabled
  );
}
