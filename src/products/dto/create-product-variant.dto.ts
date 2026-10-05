import { Type } from 'class-transformer';
import {
  IsString,
  MinLength,
  IsObject,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  sku!: string;

  @IsObject()
  options!: Record<string, string>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceOverride?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
