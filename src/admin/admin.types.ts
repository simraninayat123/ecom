import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsPositive, IsString, Min, MinLength } from 'class-validator';

export class CategoryAdminDto {
  @IsString() @MinLength(1) name!: string;
  @IsString() @MinLength(1) slug!: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdateCategoryAdminDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() @MinLength(1) slug?: string;
  @IsOptional() @IsString() description?: string;
}

export class ProductAdminDto {
  @IsString() @MinLength(1) name!: string;
  @IsString() @MinLength(1) slug!: string;
  @IsString() @MinLength(1) sku!: string;
  @IsString() description!: string;
  @Type(() => Number) @IsInt() @Min(0) price!: number;
  @IsString() imageUrl!: string;
  @Type(() => Number) @IsInt() @Min(0) stock!: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() categoryId?: string;
}

export class UpdateProductAdminDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() @MinLength(1) slug?: string;
  @IsOptional() @IsString() @MinLength(1) sku?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) price?: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() categoryId?: string;
}

export class ProductImageDto {
  @IsString() @MinLength(1) url!: string;
  @IsOptional() @IsString() altText?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
}

export class ProductVariantDto {
  @IsString() @MinLength(1) name!: string;
  @IsString() @MinLength(1) sku!: string;
  @IsObject() options!: Record<string, string>;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceOverride?: number;
  @Type(() => Number) @IsInt() @Min(0) stock!: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateProductVariantDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() @MinLength(1) sku?: string;
  @IsOptional() @IsObject() options?: Record<string, string>;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceOverride?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class InventoryAdjustmentDto {
  @IsIn(['INCREASE', 'DECREASE', 'SET']) type!: 'INCREASE' | 'DECREASE' | 'SET';
  @Type(() => Number) @IsInt() @IsPositive() quantity!: number;
  @IsString() @MinLength(1) reason!: string;
}

export class AdminOrderQueryDto {
  @IsOptional() @IsIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']) status?: string;
  @IsOptional() @IsIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED']) paymentStatus?: string;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() limit = 20;
}

export class UpdateOrderStatusDto {
  @IsIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']) status!: string;
}