import { IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString()
  shippingAddressId!: string;

  @IsOptional()
  @IsString()
  billingAddressId?: string;
}
