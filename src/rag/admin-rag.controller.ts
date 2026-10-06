import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../roles/roles.decorator.js';
import { RolesGuard } from '../roles/roles.guard.js';
import { ProductIndexService } from './product-index.service.js';

@Controller('admin/rag')
@Roles(Role.ADMIN)
@UseGuards(AuthGuard('jwt'), RolesGuard)
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
