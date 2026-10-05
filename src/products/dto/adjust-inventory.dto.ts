import { ApiProperty } from '@nestjs/swagger';
import { InventoryAdjustmentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty({
    enum: InventoryAdjustmentType,
    enumName: 'InventoryAdjustmentType',
    example: InventoryAdjustmentType.INCREASE,
    description: 'INCREASE/DECREASE change stock by quantity; SET replaces it.',
  })
  @IsEnum(InventoryAdjustmentType)
  type!: InventoryAdjustmentType;

  @ApiProperty({ example: 5, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ example: 'Restock from supplier', minLength: 1 })
  @IsString()
  @MinLength(1)
  reason!: string;
}
