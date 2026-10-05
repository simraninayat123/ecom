import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/types/jwt-payload.type.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';
import { AddressesService } from './addresses.service.js';

@Controller('addresses')
@UseGuards(AuthGuard('jwt'))
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get() findAll(@CurrentUser() user: JwtPayload) {
    return this.addressesService.findAll(user.id);
  }
  @Post() create(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateAddressDto,
  ) {
    return this.addressesService.create(user.id, body);
  }
  @Patch(':id') update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.id, id, body);
  }
  @Delete(':id') remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.addressesService.remove(user.id, id);
  }
}
