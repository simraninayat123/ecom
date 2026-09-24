import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service.js';

class RegisterDto {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login') login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}