import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { SseModule } from './sse/sse.module';

@Module({
    imports: [SseModule],
    controllers: [StatsController],
})
export class StatsModule {}