import { Module } from '@nestjs/common';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';

@Module({
    controllers: [SseController],
    providers: [SseService],
    exports: [SseService], // Экспортируем сервис для использования в других модулях
})
export class SseModule {}