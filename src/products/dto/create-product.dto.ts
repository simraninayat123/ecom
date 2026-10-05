import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Stoneware Mug', minLength: 1 })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({
    example: 'stoneware-mug',
    minLength: 1,
    description: 'URL-friendly unique name.',
  })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiProperty({ example: 'MOR-MUG-001', minLength: 1 })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiProperty({
    example: 'A hand-finished ceramic mug with a speckled glaze.',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    example: 2600,
    minimum: 0,
    description: 'In minor units (paise): 2600 = ₹26.00.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 'https://images.example.com/mug.jpg' })
  @IsString()
  imageUrl!: string;

  @ApiProperty({ example: 40, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'cmcat00000000000000000001' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
