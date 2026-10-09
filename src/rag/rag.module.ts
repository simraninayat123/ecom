import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { AdminRagController } from './admin-rag.controller.js';
import { AssistantToolsService } from './assistant-tools.service.js';
import { AssistantService } from './assistant.service.js';
import { EmbeddingService } from './embedding.service.js';
import { GenerationService } from './generation.service.js';
import { IndexingWorkerService } from './indexing-worker.service.js';
import { ProductIndexService } from './product-index.service.js';
import { RagController } from './rag.controller.js';
import { RagService } from './rag.service.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Module({
  imports: [CartModule, OrdersModule, TenantsModule],
  controllers: [RagController, AdminRagController],
  providers: [
    EmbeddingService,
    GenerationService,
    ProductIndexService,
    IndexingWorkerService,
    RagService,
    AssistantToolsService,
    AssistantService,
  ],
  exports: [ProductIndexService],
})
export class RagModule {}
