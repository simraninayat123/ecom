import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './utils/all-exceptions.filter.js';
import { AppModule } from './app.module.js';
import type { AllConfigType } from './config/config.type.js';
import { ResponseInterceptor } from './utils/response.interceptor.js';
import { validationOptions } from './utils/validation-options.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AllConfigType>);
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
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
