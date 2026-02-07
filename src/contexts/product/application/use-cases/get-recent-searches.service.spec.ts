import { GetRecentSearchesService } from './get-recent-searches.service';
import { RecentSearchRepository } from '../ports/output/recent-search.repository';

describe('GetRecentSearchesService', () => {
  let service: GetRecentSearchesService;
  let mockRepository: jest.Mocked<RecentSearchRepository>;

  beforeEach(() => {
    mockRepository = {
      findByUserId: jest.fn(),
      save: jest.fn(),
    };
    service = new GetRecentSearchesService(mockRepository);
  });

  it('should return empty array when userId is null', async () => {
    const result = await service.execute(null);

    expect(result).toEqual([]);
    expect(mockRepository.findByUserId).not.toHaveBeenCalled();
  });

  it('should return searches for user when userId is provided', async () => {
    const userId = 'user-123';
    const searches = ['laptop', 'mouse', 'keyboard'];
    mockRepository.findByUserId.mockResolvedValue(searches);

    const result = await service.execute(userId);

    expect(result).toEqual(searches);
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(
      expect.objectContaining({ value: userId }),
    );
  });

  it('should return empty array when user has no searches', async () => {
    const userId = 'user-123';
    mockRepository.findByUserId.mockResolvedValue([]);

    const result = await service.execute(userId);

    expect(result).toEqual([]);
  });
});
