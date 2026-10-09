import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class SellerOnboardingDto {
  @ApiProperty({ example: 'Acme Store' })
  @IsString()
  @MinLength(2)
  sellerName!: string;

  @ApiProperty({ example: 'acme-store' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  sellerSlug!: string;

  @ApiProperty({ example: 'Alice Owner' })
  @IsString()
  @MinLength(2)
  ownerName!: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  ownerEmail!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  ownerPassword!: string;
}
