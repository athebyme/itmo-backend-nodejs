import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { SseService } from './sse.service';
import { NotificationService } from './notification.service';
import { TestEventsService } from './test-events.service';
import { TestEventsController } from './test-events.controller';

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
        }),
    ],
    controllers: [
        StatsController,
        TestEventsController // Added test controller
    ],
    providers: [
        StatsService,
        SseService,
        NotificationService,
        TestEventsService // Added test service
    ],
    exports: [
        StatsService,
        SseService,
        NotificationService
    ]
})
export class StatsModule {}