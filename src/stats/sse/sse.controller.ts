import { Controller, Sse, MessageEvent, Param, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SseService } from './sse.service';

@Controller('sse')
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

    @Sse('product/:id')
    productUpdates(@Param('id') id: string): Observable<MessageEvent> {
        return this.sseService.subscribeToProductUpdates(parseInt(id, 10));
    }

    @Sse('warehouse/:id')
    warehouseUpdates(@Param('id') id: string): Observable<MessageEvent> {
        return this.sseService.subscribeToWarehouseUpdates(parseInt(id, 10));
    }

    @Sse('dashboard')
    dashboardUpdates(@Query('seller') seller: string): Observable<MessageEvent> {
        return this.sseService.subscribeToDashboardUpdates(seller || 'bananzza');
    }
}