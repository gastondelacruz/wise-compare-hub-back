import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TIMEOUTS } from '@common/constants/business-rules';
import { MercadoLibreTokenResponse } from './types/mercado-libre-api.types';

/**
 * Service responsible for obtaining and caching OAuth tokens from MercadoLibre API.
 * Single Responsibility: Manage OAuth authentication with MercadoLibre
 */
@Injectable()
export class MercadoLibreAuthService {
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getAccessToken(): Promise<string | null> {
    // Return cached token if still valid (with 5 minute buffer)
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 5 * 60 * 1000) {
      return this.cachedToken;
    }

    try {
      const clientId = this.configService.get<string>('MERCADOLIBRE_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'MERCADOLIBRE_CLIENT_SECRET',
      );

      if (!clientId || !clientSecret) {
        return null;
      }

      const tokenUrl = this.getTokenUrl();

      const response = await firstValueFrom(
        this.httpService
          .post<MercadoLibreTokenResponse>(
            tokenUrl,
            new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: clientId,
              client_secret: clientSecret,
            }).toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              timeout: TIMEOUTS.EXTERNAL_API,
            },
          )
          .pipe(
            catchError(() => {
              // Fail gracefully - return null on error
              return of({ data: null });
            }),
          ),
      );

      if (!response.data?.access_token) {
        return null;
      }

      // Cache token
      this.cachedToken = response.data.access_token;
      this.tokenExpiresAt = now + (response.data.expires_in || 21600) * 1000; // Default 6 hours

      return this.cachedToken;
    } catch {
      // Fail gracefully - return null on any error
      return null;
    }
  }

  clearTokenCache(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  private getTokenUrl(): string {
    const url = this.configService.get<string>('MERCADOLIBRE_OAUTH_TOKEN_URL');
    if (!url) {
      throw new Error(
        'MERCADOLIBRE_OAUTH_TOKEN_URL environment variable is required',
      );
    }
    return url;
  }
}
