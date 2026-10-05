import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home', minLength: 1 })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty({ example: 'Simran Inayat', minLength: 1 })
  @IsString()
  @MinLength(1)
  recipientName!: string;

  @ApiProperty({ example: '12 MG Road', minLength: 1 })
  @IsString()
  @MinLength(1)
  line1!: string;

  @ApiPropertyOptional({ example: 'Flat 4B' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'Bengaluru', minLength: 1 })
  @IsString()
  @MinLength(1)
  city!: string;

  @ApiProperty({ example: 'Karnataka', minLength: 1 })
  @IsString()
  @MinLength(1)
  state!: string;

  @ApiProperty({ example: '560001', minLength: 1 })
  @IsString()
  @MinLength(1)
  postalCode!: string;

  // removed default value to allow use in partial updates -> update-address.dto.ts
  @ApiPropertyOptional({
    example: 'IN',
    description: 'Defaults to "IN" in the database when omitted.',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  phone?: string;
}
