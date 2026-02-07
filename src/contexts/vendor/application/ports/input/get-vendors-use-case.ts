import { GetVendorsResponseDto } from '../../dto/get-vendors-response.dto';

export interface GetVendorsUseCase {
  execute(enabled?: boolean): Promise<GetVendorsResponseDto>;
}
