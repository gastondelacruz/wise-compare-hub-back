import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetProductOffersDto {
  @ApiPropertyOptional({
    description: 'Sort option',
    enum: ['price', 'delivery', 'rating'],
    default: 'price',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'List of vendor IDs to filter',
    example: ['amazon', 'bestbuy'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vendors?: string[];

  @ApiPropertyOptional({
    description: 'Apply user preferences if authenticated',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  preferences?: boolean;
}
