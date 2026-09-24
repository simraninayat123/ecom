import { IsOptional, IsString, MinLength } from 'class-validator';

export class AddressDto {
  @IsString() @MinLength(1) label!: string;
  @IsString() @MinLength(1) recipientName!: string;
  @IsString() @MinLength(1) line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() @MinLength(1) city!: string;
  @IsString() @MinLength(1) state!: string;
  @IsString() @MinLength(1) postalCode!: string;
  @IsOptional() @IsString() country = 'IN';
  @IsOptional() @IsString() phone?: string;
}

export class UpdateAddressDto {
  @IsOptional() @IsString() @MinLength(1) label?: string;
  @IsOptional() @IsString() @MinLength(1) recipientName?: string;
  @IsOptional() @IsString() @MinLength(1) line1?: string;
  @IsOptional() @IsString() line2?: string;
  @IsOptional() @IsString() @MinLength(1) city?: string;
  @IsOptional() @IsString() @MinLength(1) state?: string;
  @IsOptional() @IsString() @MinLength(1) postalCode?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() phone?: string;
}