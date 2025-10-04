import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

type SetupOptions = {
  enableSwagger?: boolean;
};

export function setupApp(
  app: INestApplication,
  options: SetupOptions = { enableSwagger: true },
) {
  const reflector = app.get(Reflector);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  app.enableCors();

  if (options.enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('nestjs+MySQL+Kysely+mysql2-cpanel_friendly')
      .setDescription(
        'REST API documentation for nestjs+MySQL+Kysely+mysql2-cpanel_friendly',
      )
      .setVersion('1.0.0')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument);
  }
}

export function getApplicationPort(configService: ConfigService) {
  return configService.get<number>('APP_PORT', 3000);
}
