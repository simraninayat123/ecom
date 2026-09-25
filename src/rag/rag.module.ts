import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { EmbeddingService } from './embedding.service.js';
import { IndexingWorkerService } from './indexing-worker.service.js';
import { ProductIndexService } from './product-index.service.js';
import { RagAdminController, RagController } from './rag.controller.js';
import { RagService } from './rag.service.js';

@Module({
  controllers: [RagController, RagAdminController],
  providers: [EmbeddingService, ProductIndexService, IndexingWorkerService, RagService, AuthGuard, AdminGuard],
  exports: [ProductIndexService],
})
export class RagModule {}