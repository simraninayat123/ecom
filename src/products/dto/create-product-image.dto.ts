import { Type } from 'class-transformer';
import { IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateProductImageDto {
  @IsString()
  @MinLength(1)
  url!: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
