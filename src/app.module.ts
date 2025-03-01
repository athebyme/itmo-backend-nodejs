// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConstructorModule } from './constructor/constructor.module';
import { IndexModule } from './index/index.module';
import { ConverterModule } from './converter/converter.module';
import { MainModule } from './main/main.module';
import { WildberriesModule } from './wildberries/wildberries.module';

@Module({
  imports: [
    ConstructorModule,
    IndexModule,
    ConverterModule,
    MainModule,
    WildberriesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}