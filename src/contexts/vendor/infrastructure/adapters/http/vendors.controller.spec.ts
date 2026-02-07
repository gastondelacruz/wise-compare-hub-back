import { Test, TestingModule } from '@nestjs/testing';
import { VendorsController } from './vendors.controller';
import { GetVendorsUseCase } from '@contexts/vendor/application/ports/input/get-vendors-use-case';
import {
  GetVendorsResponseDto as ApplicationResponseDto,
  VendorDto,
} from '@contexts/vendor/application/dto/get-vendors-response.dto';

describe('VendorsController', () => {
  let controller: VendorsController;
  let mockGetVendorsUseCase: jest.Mocked<GetVendorsUseCase>;

  beforeEach(async () => {
    mockGetVendorsUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorsController],
      providers: [
        {
          provide: 'GetVendorsUseCase',
          useValue: mockGetVendorsUseCase,
        },
      ],
    }).compile();

    controller = module.get<VendorsController>(VendorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all vendors when enabled is not specified', async () => {
    const vendors = [
      new VendorDto(
        'amazon',
        'Amazon',
        'https://cdn.wisecompare.com/vendors/amazon.svg',
        true,
        true,
      ),
      new VendorDto(
        'bestbuy',
        'Best Buy',
        'https://cdn.wisecompare.com/vendors/bestbuy.svg',
        true,
        true,
      ),
    ];
    const response = new ApplicationResponseDto(vendors);
    mockGetVendorsUseCase.execute.mockResolvedValue(response);

    const result = await controller.getVendors({});

    expect(result.vendors).toHaveLength(2);
    expect(result.vendors[0].id).toBe('amazon');
    expect(result.vendors[1].id).toBe('bestbuy');
    expect(mockGetVendorsUseCase.execute).toHaveBeenCalledWith(undefined);
  });

  it('should filter by enabled when enabled=true', async () => {
    const vendors = [
      new VendorDto(
        'amazon',
        'Amazon',
        'https://cdn.wisecompare.com/vendors/amazon.svg',
        true,
        true,
      ),
    ];
    const response = new ApplicationResponseDto(vendors);
    mockGetVendorsUseCase.execute.mockResolvedValue(response);

    const result = await controller.getVendors({ enabled: true });

    expect(result.vendors).toHaveLength(1);
    expect(result.vendors[0].enabled).toBe(true);
    expect(mockGetVendorsUseCase.execute).toHaveBeenCalledWith(true);
  });

  it('should filter by disabled when enabled=false', async () => {
    const vendors: VendorDto[] = [];
    const response = new ApplicationResponseDto(vendors);
    mockGetVendorsUseCase.execute.mockResolvedValue(response);

    const result = await controller.getVendors({ enabled: false });

    expect(result.vendors).toHaveLength(0);
    expect(mockGetVendorsUseCase.execute).toHaveBeenCalledWith(false);
  });

  it('should map vendor properties correctly', async () => {
    const vendors = [
      new VendorDto(
        'amazon',
        'Amazon',
        'https://cdn.wisecompare.com/vendors/amazon.svg',
        true,
        true,
      ),
    ];
    const response = new ApplicationResponseDto(vendors);
    mockGetVendorsUseCase.execute.mockResolvedValue(response);

    const result = await controller.getVendors({});

    expect(result.vendors[0]).toEqual({
      id: 'amazon',
      name: 'Amazon',
      logoUrl: 'https://cdn.wisecompare.com/vendors/amazon.svg',
      isOfficial: true,
      enabled: true,
    });
  });
});
