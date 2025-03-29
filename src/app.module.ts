import { Module } from '@nestjs/common';
import { IndexController } from './index/index.controller';
import { MainController } from "./main/main.controller";
import { ConstructorController } from "./constructor/constructor.controller";
import { ConverterController } from "./converter/converter.controller";
import { WildberriesController } from "./wildberries/wildberries.controller";
import { StatsController } from "./stats/stats.controller";
import { SseModule } from "./stats/sse/sse.module";

@Module({
  imports: [
    SseModule // Добавляем модуль SSE
  ],
  controllers: [
    IndexController,
    MainController,
    ConverterController,
    ConstructorController,
    WildberriesController,
    StatsController
  ],
  providers: [],
})
export class AppModule {}