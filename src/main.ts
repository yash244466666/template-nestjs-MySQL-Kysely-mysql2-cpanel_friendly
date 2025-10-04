import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getApplicationPort, setupApp } from './config/setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  setupApp(app);
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = getApplicationPort(configService);

  await app.listen(port);
  const url = await app.getUrl();
  console.info(`Application running on ${url}`);
}

void bootstrap();
