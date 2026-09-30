import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { OptionalAuthGuard } from '../auth/optional-auth.guard.js';
import { CartModule } from '../cart/cart.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { AssistantToolsService } from './assistant-tools.service.js';
import { AssistantService } from './assistant.service.js';
import { EmbeddingService } from './embedding.service.js';
import { GenerationService } from './generation.service.js';
import { IndexingWorkerService } from './indexing-worker.service.js';
import { ProductIndexService } from './product-index.service.js';
import { RagAdminController, RagController } from './rag.controller.js';
import { RagService } from './rag.service.js';

@Module({
  imports: [CartModule, OrdersModule],
  controllers: [RagController, RagAdminController],
  providers: [EmbeddingService, GenerationService, ProductIndexService, IndexingWorkerService, RagService, AssistantToolsService, AssistantService, AuthGuard, AdminGuard, OptionalAuthGuard],
  exports: [ProductIndexService],
})
export class RagModule {}