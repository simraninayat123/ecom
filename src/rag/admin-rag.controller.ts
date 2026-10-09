import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SellerMembershipRole } from '@prisma/client';
import { SellerRoles } from '../tenants/decorators/seller-roles.decorator.js';
import { SellerAccessGuard } from '../tenants/seller-access.guard.js';
import { ProductIndexService } from './product-index.service.js';

@Controller('admin/rag')
@SellerRoles(SellerMembershipRole.MANAGER)
@UseGuards(AuthGuard('jwt'), SellerAccessGuard)
@ApiBearerAuth()
export class AdminRagController {
  constructor(private readonly productIndexService: ProductIndexService) {}

  @Get('indexing-status')
  indexingStatus() {
    return this.productIndexService.status();
  }

  @Post('reindex')
  reindex() {
    return this.productIndexService.enqueueAll();
  }
}
