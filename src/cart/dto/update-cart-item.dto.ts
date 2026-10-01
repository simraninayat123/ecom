import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;
}
