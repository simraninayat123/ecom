import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AuthGuard],
})
export class UsersModule {}