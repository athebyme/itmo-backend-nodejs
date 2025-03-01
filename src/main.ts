import * as expressLayouts from 'express-ejs-layouts';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  app.use(expressLayouts);
  app.set('layout', 'layout');

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();