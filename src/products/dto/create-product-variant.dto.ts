import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({ example: 'Large / Oat', minLength: 1 })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'MOR-THROW-001-L-OAT', minLength: 1 })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { size: 'L', colour: 'Oat' },
  })
  @IsObject()
  options!: Record<string, string>;

  @ApiPropertyOptional({
    example: 9800,
    minimum: 0,
    description: "In minor units (paise). Replaces the product's price.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceOverride?: number;

  @ApiProperty({ example: 10, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
