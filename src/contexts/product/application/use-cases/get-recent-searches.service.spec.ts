import { Test, TestingModule } from '@nestjs/testing';
import { GetRecentSearchesService } from './get-recent-searches.service';
import { RecentSearchRepository } from '../ports/output/recent-search.repository';
import { RecentSearch } from '@contexts/product/domain/models/recent-search.entity';
import { PRODUCT_RULES } from '@contexts/product/domain/constants/product-rules';

describe('GetRecentSearchesService', () => {
  let service: GetRecentSearchesService;
  let mockRepository: jest.Mocked<RecentSearchRepository>;

  beforeEach(async () => {
    mockRepository = {
      findByUserId: jest.fn(),
      findGlobal: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRecentSearchesService,
        {
          provide: 'RecentSearchRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GetRecentSearchesService>(GetRecentSearchesService);
  });

  describe('execute', () => {
    it('should return user searches when userId is provided', async () => {
      const userId = 'user-123';
      const userSearches = [
        new RecentSearch('laptop', userId),
        new RecentSearch('mouse', userId),
      ];

      mockRepository.findByUserId.mockResolvedValue(userSearches);

      const result = await service.execute(userId);

      expect(result).toEqual(userSearches);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.findGlobal).not.toHaveBeenCalled();
    });

    it('should return global searches when userId is not provided', async () => {
      const globalSearches = [
        new RecentSearch('laptop'),
        new RecentSearch('keyboard'),
      ];

      mockRepository.findGlobal.mockResolvedValue(globalSearches);

      const result = await service.execute();

      expect(result).toEqual(globalSearches);
      expect(mockRepository.findGlobal).toHaveBeenCalled();
      expect(mockRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should return global searches when userId is undefined', async () => {
      const globalSearches = [new RecentSearch('laptop')];

      mockRepository.findGlobal.mockResolvedValue(globalSearches);

      const result = await service.execute(undefined);

      expect(result).toEqual(globalSearches);
      expect(mockRepository.findGlobal).toHaveBeenCalled();
      expect(mockRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should limit results to MAX_RECENT_SEARCHES', async () => {
      const userId = 'user-123';
      const manySearches = Array.from(
        { length: PRODUCT_RULES.MAX_RECENT_SEARCHES + 5 },
        (_, i) => new RecentSearch(`search-${i}`, userId),
      );

      mockRepository.findByUserId.mockResolvedValue(manySearches);

      const result = await service.execute(userId);

      expect(result).toHaveLength(PRODUCT_RULES.MAX_RECENT_SEARCHES);
      expect(result).toEqual(
        manySearches.slice(0, PRODUCT_RULES.MAX_RECENT_SEARCHES),
      );
    });

    it('should return empty array when no searches found for user', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await service.execute('user-123');

      expect(result).toEqual([]);
    });

    it('should return empty array when no global searches found', async () => {
      mockRepository.findGlobal.mockResolvedValue([]);

      const result = await service.execute();

      expect(result).toEqual([]);
    });
  });
});
