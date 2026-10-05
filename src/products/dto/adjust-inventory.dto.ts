import { Type } from 'class-transformer';
import {
  IsInt,
  IsPositive,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';
import { InventoryAdjustmentType } from '@prisma/client';

export class AdjustInventoryDto {
  @IsEnum(InventoryAdjustmentType)
  type!: InventoryAdjustmentType;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsString()
  @MinLength(1)
  reason!: string;
}
