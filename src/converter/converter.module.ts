// src/converter/converter.module.ts
import { Module } from '@nestjs/common';
import { ConverterController } from './converter.controller';

@Module({
    controllers: [ConverterController],
})
export class ConverterModule {}