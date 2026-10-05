import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://images.example.com/mug-side.jpg' })
  @IsString()
  @MinLength(1)
  url!: string;

  @ApiPropertyOptional({ example: 'Mug from the side' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({
    example: 0,
    minimum: 0,
    description: 'Lower numbers are shown first.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
