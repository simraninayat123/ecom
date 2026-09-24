import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3001' });
  const swaggerConfig = new DocumentBuilder().setTitle('Morrow Supply API').setDescription('E-commerce catalogue, cart, order, and admin API').setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
