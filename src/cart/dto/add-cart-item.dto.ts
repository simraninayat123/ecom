import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive, IsString } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: 'cmprod0000000000000000001' })
  @IsString()
  productId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;
}
