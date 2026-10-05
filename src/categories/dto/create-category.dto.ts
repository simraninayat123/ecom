import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Kitchen', minLength: 1 })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({
    example: 'kitchen',
    minLength: 1,
    description: 'URL-friendly unique name.',
  })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiPropertyOptional({
    example: 'Practical tools for cooking, serving, and sharing.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
