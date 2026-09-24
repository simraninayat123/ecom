import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { AddressDto, UpdateAddressDto } from './address.types.js';
import { AddressesService } from './addresses.service.js';

@Controller('addresses')
@UseGuards(AuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get() findAll(@Req() request: AuthenticatedRequest) { return this.addressesService.findAll(request.user.id); }
  @Post() create(@Req() request: AuthenticatedRequest, @Body() body: AddressDto) { return this.addressesService.create(request.user.id, body); }
  @Patch(':id') update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateAddressDto) { return this.addressesService.update(request.user.id, id, body); }
  @Delete(':id') remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.addressesService.remove(request.user.id, id); }
}