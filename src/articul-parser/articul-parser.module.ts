import { Module } from '@nestjs/common';
import { ArticulParserController } from './articul-parser.controller';

@Module({
    controllers: [ArticulParserController],
})
export class ArticulParserModule {}