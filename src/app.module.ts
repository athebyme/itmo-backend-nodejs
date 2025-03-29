import { Module } from '@nestjs/common';
import { IndexController } from './index/index.controller';
import { MainController } from "./main/main.controller";
import { ConstructorController } from "./constructor/constructor.controller";
import { ConverterController } from "./converter/converter.controller";
import { WildberriesController } from "./wildberries/wildberries.controller";
import { StatsController } from "./stats/stats.controller";
import { StatsService } from "./stats/stats.service";
import { AuthModule } from './auth/auth.module';
import { UsersService } from './users/user.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'crazybob',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [
    IndexController,
    MainController,
    ConverterController,
    ConstructorController,
    WildberriesController,
    StatsController
  ],
  providers: [UsersService, StatsService],
})
export class AppModule {}