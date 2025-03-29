import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { config } from 'dotenv';
config();
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  const expressLayouts = require('express-ejs-layouts');
  app.use(expressLayouts);
  app.set('layout', 'layouts/main_layout');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);

  await app.listen(3000);
}
bootstrap();