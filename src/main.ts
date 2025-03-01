import * as expressLayouts from 'express-ejs-layouts';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs'); // **FIRST: Set View Engine to EJS**

  app.use(expressLayouts);   // **SECOND: THEN use express-ejs-layouts**
  app.set('layout', 'layout'); // Set default layout name

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();