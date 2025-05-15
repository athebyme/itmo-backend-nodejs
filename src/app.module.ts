import { Module } from '@nestjs/common';
import { IndexController } from './index/index.controller';
import { MainController } from "./main/main.controller";
import { ConstructorController } from "./constructor/constructor.controller";
import { ConverterController } from "./converter/converter.controller";
import { WildberriesController } from "./wildberries/wildberries.controller";
import { StatsController } from "./stats/stats.controller";
import { ArticulParserController } from "./articul-parser/articul-parser.controller";

@Module({
  imports: [],
  controllers: [
    IndexController,
    MainController,
    ConverterController,
    ConstructorController,
    WildberriesController,
    StatsController,
    ArticulParserController
  ],
  providers: [],
})
export class AppModule {}