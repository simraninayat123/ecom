import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class ProductQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPrice?: number;
  @IsOptional() @IsIn(['newest', 'price_asc', 'price_desc']) sort?: 'newest' | 'price_asc' | 'price_desc';
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() @Max(100) limit = 20;
}