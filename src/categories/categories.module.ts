import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { AdminCategoriesController } from './admin-categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Module({
  imports: [TenantsModule],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
