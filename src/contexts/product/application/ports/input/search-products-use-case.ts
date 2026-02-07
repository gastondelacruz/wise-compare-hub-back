import { SearchProductsQuery } from '../../dto/search-products-query';
import { SearchProductsResponseDto } from '../../dto/search-products-response.dto';

export interface SearchProductsUseCase {
  execute(query: SearchProductsQuery): Promise<SearchProductsResponseDto>;
}
