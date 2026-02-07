export class VendorDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly logoUrl: string,
    public readonly isOfficial: boolean,
    public readonly enabled: boolean,
  ) {}
}

export class GetVendorsResponseDto {
  constructor(public readonly vendors: VendorDto[]) {}
}
