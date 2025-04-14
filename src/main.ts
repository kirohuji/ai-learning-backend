import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createSwaggerDocument } from './configurations/swagger.config';
import { ConfigService } from '@nestjs/config';
import { SuccessResponseInterceptor } from '@/interceptor/success-response.interceptor';
import { HttpExceptionFilter } from './exception-handler/http-exception.filter';

import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  const configService = app.get(ConfigService);

  app.useBodyParser('json', { limit: '15mb' });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          return {
            field: error.property,
            message: Object.values(error.constraints || {}).join(', '),
          };
        });
        return {
          message: messages,
          error: 'Bad Request',
          statusCode: 400,
        };
      },
    }),
  );
  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  const document = SwaggerModule.createDocument(
    app,
    createSwaggerDocument(configService.getOrThrow('SwaggerConfig')),
  );
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
