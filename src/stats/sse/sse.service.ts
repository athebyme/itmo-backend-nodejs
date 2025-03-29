import { Injectable } from '@nestjs/common';
import { Observable, Subject, interval, map } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

interface PriceChangeEvent {
    productId: number;
    productName: string;
    oldPrice: number;
    newPrice: number;
    changeAmount: number;
    changePercent: number;
    date: string;
}

interface StockChangeEvent {
    productId: number;
    productName: string;
    warehouseId: number;
    warehouseName: string;
    oldAmount: number;
    newAmount: number;
    changeAmount: number;
    changePercent: number;
    date: string;
}

@Injectable()
export class SseService {
    private priceEvents = new Subject<PriceChangeEvent>();
    private stockEvents = new Subject<StockChangeEvent>();
    private productEvents = new Map<number, Subject<any>>();
    private warehouseEvents = new Map<number, Subject<any>>();
    private dashboardEvents = new Map<string, Subject<any>>();

    constructor() {
        this.simulateEvents();
    }

    emitPriceChange(priceChange: PriceChangeEvent): void {
        this.priceEvents.next(priceChange);

        const productSubject = this.productEvents.get(priceChange.productId);
        if (productSubject) {
            productSubject.next({
                type: 'price-change',
                data: priceChange
            });
        }

        this.dashboardEvents.forEach((subject) => {
            subject.next({
                type: 'price-change',
                data: priceChange
            });
        });
    }

    emitStockChange(stockChange: StockChangeEvent): void {
        this.stockEvents.next(stockChange);

        const productSubject = this.productEvents.get(stockChange.productId);
        if (productSubject) {
            productSubject.next({
                type: 'stock-change',
                data: stockChange
            });
        }

        const warehouseSubject = this.warehouseEvents.get(stockChange.warehouseId);
        if (warehouseSubject) {
            warehouseSubject.next({
                type: 'stock-change',
                data: stockChange
            });
        }

        this.dashboardEvents.forEach((subject) => {
            subject.next({
                type: 'stock-change',
                data: stockChange
            });
        });
    }

    subscribeToPriceChanges(): Observable<MessageEvent> {
        return this.priceEvents.pipe(
            map((event) => ({
                data: JSON.stringify(event),
                type: 'price-change',
                id: String(new Date().getTime())
            }))
        );
    }

    subscribeToStockChanges(): Observable<MessageEvent> {
        return this.stockEvents.pipe(
            map((event) => ({
                data: JSON.stringify(event),
                type: 'stock-change',
                id: String(new Date().getTime())
            }))
        );
    }

    subscribeToProductUpdates(productId: number): Observable<MessageEvent> {
        if (!this.productEvents.has(productId)) {
            this.productEvents.set(productId, new Subject<any>());
        }

        return this.productEvents.get(productId).pipe(
            map((event) => ({
                data: JSON.stringify(event.data),
                type: event.type,
                id: String(new Date().getTime())
            }))
        );
    }

    subscribeToWarehouseUpdates(warehouseId: number): Observable<MessageEvent> {
        if (!this.warehouseEvents.has(warehouseId)) {
            this.warehouseEvents.set(warehouseId, new Subject<any>());
        }

        return this.warehouseEvents.get(warehouseId).pipe(
            map((event) => ({
                data: JSON.stringify(event.data),
                type: event.type,
                id: String(new Date().getTime())
            }))
        );
    }

    subscribeToDashboardUpdates(seller: string): Observable<MessageEvent> {
        if (!this.dashboardEvents.has(seller)) {
            this.dashboardEvents.set(seller, new Subject<any>());
        }

        return this.dashboardEvents.get(seller).pipe(
            map((event) => ({
                data: JSON.stringify(event.data),
                type: event.type,
                id: String(new Date().getTime())
            }))
        );
    }

    private simulateEvents(): void {
        // Симуляция изменений цен
        interval(15000).subscribe(() => {
            const priceChange: PriceChangeEvent = {
                productId: Math.floor(Math.random() * 5000) + 1,
                productName: 'Тестовый товар ' + Math.floor(Math.random() * 100),
                oldPrice: Math.floor(Math.random() * 10000),
                newPrice: 0,
                changeAmount: 0,
                changePercent: 0,
                date: new Date().toISOString()
            };

            // Генерация случайного изменения цены
            const isIncrease = Math.random() > 0.5;
            const changePercent = Math.random() * (isIncrease ? 20 : 15);

            if (isIncrease) {
                priceChange.newPrice = Math.round(priceChange.oldPrice * (1 + changePercent / 100));
                priceChange.changeAmount = priceChange.newPrice - priceChange.oldPrice;
                priceChange.changePercent = changePercent;
            } else {
                priceChange.newPrice = Math.round(priceChange.oldPrice * (1 - changePercent / 100));
                priceChange.changeAmount = priceChange.newPrice - priceChange.oldPrice;
                priceChange.changePercent = -changePercent;
            }

            this.emitPriceChange(priceChange);
        });

        interval(20000).subscribe(() => {
            const warehouseIds = [575679, 575682];
            const warehouseNames = ['X-sklad SPB', 'X-sklad MSK'];

            const randomIdx = Math.floor(Math.random() * warehouseIds.length);

            const stockChange: StockChangeEvent = {
                productId: Math.floor(Math.random() * 5000) + 1,
                productName: 'Тестовый товар ' + Math.floor(Math.random() * 100),
                warehouseId: warehouseIds[randomIdx],
                warehouseName: warehouseNames[randomIdx],
                oldAmount: Math.floor(Math.random() * 200) + 1,
                newAmount: 0,
                changeAmount: 0,
                changePercent: 0,
                date: new Date().toISOString()
            };

            const isIncrease = Math.random() > 0.4;

            if (isIncrease) {
                stockChange.newAmount = stockChange.oldAmount + Math.floor(Math.random() * 30) + 1;
                stockChange.changeAmount = stockChange.newAmount - stockChange.oldAmount;
                stockChange.changePercent = (stockChange.changeAmount / stockChange.oldAmount) * 100;
            } else {
                const decrease = Math.floor(Math.random() * stockChange.oldAmount);
                stockChange.newAmount = Math.max(0, stockChange.oldAmount - decrease);
                stockChange.changeAmount = stockChange.newAmount - stockChange.oldAmount;
                stockChange.changePercent = (stockChange.changeAmount / stockChange.oldAmount) * 100;
            }

            this.emitStockChange(stockChange);
        });
    }
}