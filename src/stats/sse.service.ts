import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

class ServerSentEvent {
    constructor(
        public data: string,
        public type?: string,
        public id?: string,
    ) {}

    toString(): string {
        let result = '';
        if (this.type) {
            result += `event: ${this.type}\n`;
        }
        if (this.id) {
            result += `id: ${this.id}\n`;
        }
        result += `data: ${this.data}\n\n`;
        return result;
    }
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

    subscribeToPriceChanges(): Observable<any> {
        return this.priceEvents.pipe(
            map(event => new ServerSentEvent(
                JSON.stringify(event),
                'price-change',
                String(new Date().getTime())
            ))
        );
    }

    subscribeToStockChanges(): Observable<any> {
        return this.stockEvents.pipe(
            map(event => new ServerSentEvent(
                JSON.stringify(event),
                'stock-change',
                String(new Date().getTime())
            ))
        );
    }
}