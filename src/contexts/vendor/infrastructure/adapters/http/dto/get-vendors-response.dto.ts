import { ApiProperty } from '@nestjs/swagger';
import {
  GetVendorsResponseDto as ApplicationGetVendorsResponseDto,
  VendorDto as ApplicationVendorDto,
} from '@contexts/vendor/application/dto/get-vendors-response.dto';

export class VendorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  logoUrl: string;

  @ApiProperty()
  isOfficial: boolean;

  @ApiProperty()
  enabled: boolean;
}

export class GetVendorsResponseDto {
  @ApiProperty({ type: [VendorResponseDto] })
  vendors: VendorResponseDto[];

  static fromApplication(
    dto: ApplicationGetVendorsResponseDto,
  ): GetVendorsResponseDto {
    return {
      vendors: dto.vendors.map((vendor) => this.mapVendor(vendor)),
    };
  }

  private static mapVendor(vendor: ApplicationVendorDto): VendorResponseDto {
    return {
      id: vendor.id,
      name: vendor.name,
      logoUrl: vendor.logoUrl,
      isOfficial: vendor.isOfficial,
      enabled: vendor.enabled,
    };
  }
}
