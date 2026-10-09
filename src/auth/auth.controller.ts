import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthLoginDto } from './dto/auth-login.dto.js';
import { AuthRegisterDto } from './dto/auth-register.dto.js';
import { ResponseMessage } from '../utils/response-message.decorator.js';
import { SellerOnboardingDto } from './dto/seller-onboarding.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ResponseMessage('Account created successfully')
  register(@Body() body: AuthRegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @ResponseMessage('Logged in successfully')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: AuthLoginDto) {
    return this.authService.login(body);
  }

  @Post('seller-onboarding')
  @ResponseMessage('Seller created successfully')
  onboardSeller(@Body() body: SellerOnboardingDto) {
    return this.authService.onboardSeller(body);
  }
}
