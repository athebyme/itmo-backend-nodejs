import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SseService {
    private priceChangesSubject = new Subject<any>();
    private stockChangesSubject = new Subject<any>();

    emitPriceChange(priceChange: any): void {
        this.priceChangesSubject.next(priceChange);
    }

    emitStockChange(stockChange: any): void {
        this.stockChangesSubject.next(stockChange);
    }

    subscribeToPriceChanges(): Observable<any> {
        return this.priceChangesSubject.pipe(
            map(data => ({
                data: JSON.stringify(data),
                type: 'price-change',
                id: String(new Date().getTime())
            }))
        );
    }

    subscribeToStockChanges(): Observable<any> {
        return this.stockChangesSubject.pipe(
            map(data => ({
                data: JSON.stringify(data),
                type: 'stock-change',
                id: String(new Date().getTime())
            }))
        );
    }
}