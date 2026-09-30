import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { OptionalAuthGuard } from '../auth/optional-auth.guard.js';
import { AssistantService } from './assistant.service.js';
import { ProductIndexService } from './product-index.service.js';
import { RagService } from './rag.service.js';
import { ChatDto, RecommendationDto } from './rag.types.js';

@Controller('rag')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class RagController {
  constructor(private readonly ragService: RagService, private readonly assistant: AssistantService) {}

  @Post('recommendations') recommend(@Body() body: RecommendationDto) {
    return this.ragService.recommend(body.query, body.limit);
  }

  /** Tool-using shopping assistant. Order and cart tools only work with a valid bearer token. */
  @Post('chat') @UseGuards(OptionalAuthGuard) chat(@Req() request: Partial<AuthenticatedRequest>, @Body() body: ChatDto) {
    return this.assistant.chat(body.message, body.history ?? [], request.user?.id ?? null);
  }
}

@Controller('admin/rag')
@UseGuards(AuthGuard, AdminGuard)
export class RagAdminController {
  constructor(private readonly productIndexService: ProductIndexService) {}

  @Get('indexing-status') status() { return this.productIndexService.status(); }
  @Post('reindex') reindex() { return this.productIndexService.enqueueAll(); }
}