import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class GetOffersDto {
  @ApiPropertyOptional({
    description: 'Sort option',
    enum: ['price', 'delivery', 'rating'],
    default: 'price',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description:
      'List of vendor IDs to filter. Can be a single vendor or multiple vendors.',
    example: ['amazon', 'bestbuy'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }: { value: string | string[] | undefined }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
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
