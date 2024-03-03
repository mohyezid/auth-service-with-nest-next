import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(UserModule);
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    // all headers that client are allowed to use
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'X-Requested-With',
      'apollo-require-preflight',
    ],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  });
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'server/email-templates'));
  app.setViewEngine('ejs');
  await app.listen(4001);
}
bootstrap();
