import { Module } from '@nestjs/common';
import { ConstructorController } from './constructor.controller';

@Module({
    controllers: [ConstructorController],
})
export class ConstructorModule {}