import { Controller, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SseService } from './sse.service';

@Controller('api/sse')
export class SseController {
    constructor(private readonly sseService: SseService) {}

    @Sse('price-changes')
    priceChanges(): Observable<MessageEvent> {
        return this.sseService.subscribeToPriceChanges();
    }

    @Sse('stock-changes')
    stockChanges(): Observable<MessageEvent> {
        return this.sseService.subscribeToStockChanges();
    }
}