import { IsString, IsOptional, IsNumber, IsArray, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchProductsDto {
  @ApiPropertyOptional({
    description: 'Text search query',
    example: 'macbook',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Sort option',
    enum: ['relevance', 'price_asc', 'price_desc', 'rating'],
    default: 'relevance',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minPrice must be a number' })
  @Min(0, { message: 'minPrice must be greater than or equal to 0' })
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 3000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'maxPrice must be a number' })
  @Min(0, { message: 'maxPrice must be greater than or equal to 0' })
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'List of vendor IDs to filter',
    example: ['amazon', 'bestbuy'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vendors?: string[];
}
