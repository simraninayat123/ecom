import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { RagModule } from '../rag/rag.module.js';

@Module({ imports: [RagModule], controllers: [AdminController], providers: [AdminService] })
export class AdminModule {}