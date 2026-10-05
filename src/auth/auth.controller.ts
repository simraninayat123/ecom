import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthLoginDto } from './dto/auth-login.dto.js';
import { AuthRegisterDto } from './dto/auth-register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: AuthRegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: AuthLoginDto) {
    return this.authService.login(body);
  }
}
