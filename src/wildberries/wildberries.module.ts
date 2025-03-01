// src/wildberries/wildberries.module.ts
import { Module } from '@nestjs/common';
import { WildberriesController } from './wildberries.controller';

@Module({
    controllers: [WildberriesController],
})
export class WildberriesModule {}