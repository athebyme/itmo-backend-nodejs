import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SseService {
    private priceEvents = new Subject<any>();
    private stockEvents = new Subject<any>();

    emitPriceChange(priceChange: any): void {
        this.priceEvents.next(priceChange);
    }

    emitStockChange(stockChange: any): void {
        this.stockEvents.next(stockChange);
    }

    subscribeToPriceChanges(): Observable<MessageEvent> {
        return this.priceEvents.pipe(
            map((event) => ({
                data: JSON.stringify(event),
                type: 'price-change',
                id: String(new Date().getTime()),
            } as MessageEvent))
        );
    }

    subscribeToStockChanges(): Observable<MessageEvent> {
        return this.stockEvents.pipe(
            map((event) => ({
                data: JSON.stringify(event),
                type: 'stock-change',
                id: String(new Date().getTime()),
            } as MessageEvent))
        );
    }
}