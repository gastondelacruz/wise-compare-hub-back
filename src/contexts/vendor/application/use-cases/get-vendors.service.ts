import { Injectable, Inject } from '@nestjs/common';
import { GetVendorsUseCase } from '../ports/input/get-vendors-use-case';
import {
  GetVendorsResponseDto,
  VendorDto,
} from '../dto/get-vendors-response.dto';
import { VendorRepository } from '../ports/output/vendor.repository';

@Injectable()
export class GetVendorsService implements GetVendorsUseCase {
  constructor(
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
  ) {}

  async execute(enabled?: boolean): Promise<GetVendorsResponseDto> {
    const vendors =
      enabled !== undefined
        ? await this.vendorRepository.findByEnabled(enabled)
        : await this.vendorRepository.findAll();

    const vendorDtos = vendors.map(
      (vendor) =>
        new VendorDto(
          vendor.id.value,
          vendor.name,
          vendor.logoUrl,
          vendor.isOfficial,
          vendor.enabled,
        ),
    );

    return new GetVendorsResponseDto(vendorDtos);
  }
}
