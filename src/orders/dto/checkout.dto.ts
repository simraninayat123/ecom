import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ example: 'cmaddr0000000000000000001' })
  @IsString()
  shippingAddressId!: string;

  @ApiPropertyOptional({
    example: 'cmaddr0000000000000000002',
    description: 'Defaults to the shipping address when omitted.',
  })
  @IsOptional()
  @IsString()
  billingAddressId?: string;
}
