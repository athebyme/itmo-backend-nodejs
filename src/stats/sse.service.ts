import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

interface CustomMessageEvent {
    data: string;
    type: string;
    id: string;
}

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

    subscribeToPriceChanges(): Observable<CustomMessageEvent> {
        return this.priceEvents.pipe(
            map((event) => ({
                data: JSON.stringify(event),
                type: 'price-change',
                id: String(new Date().getTime()),
            }))
        );
    }

    subscribeToStockChanges(): Observable<CustomMessageEvent> {
        return this.stockEvents.pipe(
            map((event) => ({
                data: JSON.stringify(event),
                type: 'stock-change',
                id: String(new Date().getTime()),
            }))
        );
    }
}