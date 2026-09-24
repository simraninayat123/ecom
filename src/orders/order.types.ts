import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString() shippingAddressId!: string;
  @IsOptional() @IsString() billingAddressId?: string;
}

export class OrderQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() limit = 20;
}