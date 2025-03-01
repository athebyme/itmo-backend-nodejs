// src/main/main.module.ts
import { Module } from '@nestjs/common';
import { MainController } from './main.controller';

@Module({
    controllers: [MainController],
})
export class MainModule {}