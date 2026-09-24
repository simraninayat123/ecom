import { Type } from 'class-transformer';
import { IsInt, IsPositive, IsString } from 'class-validator';

export class AddCartItemDto {
  @IsString() productId!: string;
  @Type(() => Number) @IsInt() @IsPositive() quantity!: number;
}

export class UpdateCartItemDto {
  @Type(() => Number) @IsInt() @IsPositive() quantity!: number;
}