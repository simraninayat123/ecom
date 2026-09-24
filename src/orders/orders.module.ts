import { Module } from '@nestjs/common';
import { AddressesController } from './addresses.controller.js';
import { AddressesService } from './addresses.service.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({ controllers: [AddressesController, OrdersController], providers: [AddressesService, OrdersService] })
export class OrdersModule {}