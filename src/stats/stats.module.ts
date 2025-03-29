import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StatsController } from '/stats.controller';
import { StatsService } from '/stats.service';
import { SSEService } from '/sse.service';
import { NotificationService } from '/notification.service';

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
        }),
    ],
    controllers: [StatsController],
    providers: [
        StatsService,
        SSEService,
        NotificationService
    ],
    exports: [
        StatsService,
        SSEService
    ]
})
export class StatsModule {}