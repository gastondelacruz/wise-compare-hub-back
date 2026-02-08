import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { VendorOfferProvider } from '@contexts/offer/application/ports/output/vendor-offer-provider';
import { Offer } from '@contexts/offer/domain/models/offer.entity';
import { CanonicalProductId } from '@contexts/product/domain/models/canonical-product-id.vo';
import { MercadoLibreAuthService } from './mercado-libre-auth.service';
import { MercadoLibreItemExtractor } from './mappers/mercado-libre-item-extractor';
import { MercadoLibreOfferMapper } from './mappers/mercado-libre-offer-mapper';
import { createMercadoLibreVendor } from './mercado-libre-vendor';
import { MercadoLibreProductsSearchResponse } from './types/mercado-libre-api.types';
import { TIMEOUTS } from '@common/constants/business-rules';

/**
 * Provider for fetching offers from MercadoLibre API.
 * Single Responsibility: Orchestrate the flow of fetching offers from external API
 */
@Injectable()
export class MercadoLibreOfferProvider implements VendorOfferProvider {
  private readonly mercadoLibreVendor = createMercadoLibreVendor();
  private readonly itemExtractor = new MercadoLibreItemExtractor();
  private readonly offerMapper: MercadoLibreOfferMapper;

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: MercadoLibreAuthService,
    private readonly configService: ConfigService,
  ) {
    this.offerMapper = new MercadoLibreOfferMapper(this.mercadoLibreVendor);
  }

  async fetchOffers(canonicalProductId: CanonicalProductId): Promise<Offer[]> {
    try {
      // Get access token
      const accessToken = await this.authService.getAccessToken();
      if (!accessToken) {
        // Fail gracefully - return empty array if token cannot be obtained
        return [];
      }

      // Fetch products from Mercado Libre
      const response = await this.fetchProductsFromApi(
        canonicalProductId,
        accessToken,
      );

      if (!response.data?.results || response.data.results.length === 0) {
        return [];
      }

      // Extract items from products (products can contain multiple items)
      const items = this.itemExtractor.extractItemsFromProducts(
        response.data.results,
      );

      if (items.length === 0) {
        return [];
      }

      // Map items to domain Offers
      return this.offerMapper.mapItemsToOffers(items, canonicalProductId);
    } catch {
      // Fail gracefully - return empty array on any error
      return [];
    }
  }

  private async fetchProductsFromApi(
    canonicalProductId: CanonicalProductId,
    accessToken: string,
  ): Promise<{ data: MercadoLibreProductsSearchResponse }> {
    const response = await firstValueFrom(
      this.httpService
        .get<MercadoLibreProductsSearchResponse>(this.getProductsSearchUrl(), {
          params: {
            status: 'active',
            site_id: 'MLA',
            q: canonicalProductId.value,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: TIMEOUTS.EXTERNAL_API,
        })
        .pipe(
          catchError(() => {
            // Fail gracefully - return empty results on any error
            const emptyResponse: MercadoLibreProductsSearchResponse = {
              keywords: '',
              results: [],
              paging: {
                total: 0,
                offset: 0,
                limit: 50,
                last: '',
              },
              query_type: 'KEYWORDS',
            };
            return of({ data: emptyResponse });
          }),
        ),
    );

    return response;
  }

  private getProductsSearchUrl(): string {
    const url = this.configService.get<string>(
      'MERCADOLIBRE_PRODUCTS_SEARCH_URL',
    );
    if (!url) {
      throw new Error(
        'MERCADOLIBRE_PRODUCTS_SEARCH_URL environment variable is required',
      );
    }
    return url;
  }
}
