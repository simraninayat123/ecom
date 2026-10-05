import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive } from 'class-validator';

export class AdminOrderQueryDto {
  @IsOptional()
  @IsIn([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ])
  status?: string;
  @IsOptional()
  @IsIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
  paymentStatus?: string;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() limit = 20;
}

export class UpdateOrderStatusDto {
  @IsIn([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ])
  status!: string;
}
