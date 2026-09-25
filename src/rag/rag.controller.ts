import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ProductIndexService } from './product-index.service.js';
import { RagService } from './rag.service.js';
import { RecommendationDto } from './rag.types.js';

@Controller('rag')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('recommendations') recommend(@Body() body: RecommendationDto) {
    return this.ragService.recommend(body.query, body.limit);
  }
}

@Controller('admin/rag')
@UseGuards(AuthGuard, AdminGuard)
export class RagAdminController {
  constructor(private readonly productIndexService: ProductIndexService) {}

  @Get('indexing-status') status() { return this.productIndexService.status(); }
  @Post('reindex') reindex() { return this.productIndexService.enqueueAll(); }
}