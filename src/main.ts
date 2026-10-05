import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { AppModule } from './app.module.js';
import type { AllConfigType } from './config/config.type.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AllConfigType>);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: configService.getOrThrow('app.frontendUrl', { infer: true }),
  });
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Morrow Supply API')
    .setDescription('E-commerce catalogue, cart, order, and admin API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
await bootstrap();
