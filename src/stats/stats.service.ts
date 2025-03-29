import { Injectable } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';

@Injectable()
export class StatsService {
    // Simulate mock data that would change over time
    private mockPriceChanges = [
        {productId: 3784, productName: 'Натуральная массажная свеча Bougie Massage Candle 35 мл', vendorCode: 'id-27426-1366', oldPrice: 732, newPrice: 1065, changeAmount: 333, changePercent: 45.5, date: '2025-03-27T17:00:00Z'},
        {productId: 3785, productName: 'Массажная свеча с ароматом шоколада Bougie Massage Candle35', vendorCode: 'id-19549-1366', oldPrice: 749, newPrice: 1058, changeAmount: 309, changePercent: 41.3, date: '2025-03-27T17:00:00Z'},
        {productId: 3786, productName: 'Массажная свеча с ароматом кокоса Bougie Massage Candle 35мл', vendorCode: 'id-19543-1366', oldPrice: 758, newPrice: 1063, changeAmount: 305, changePercent: 40.2, date: '2025-03-27T17:00:00Z'}
    ];

    getPriceChangesStream(seller: string): Observable<MessageEvent> {
        return interval(5000).pipe(
            map((_) => {
                // In a real application, you would fetch real data changes here
                // For the demo, we'll just randomly modify one of the price changes
                const index = Math.floor(Math.random() * this.mockPriceChanges.length);
                const change = { ...this.mockPriceChanges[index] };

                // Randomly increase or decrease the price
                const priceChange = Math.floor(Math.random() * 50) - 25;
                change.newPrice = Math.max(100, change.newPrice + priceChange);
                change.changeAmount = change.newPrice - change.oldPrice;
                change.changePercent = (change.changeAmount / change.oldPrice) * 100;
                change.date = new Date().toISOString();

                // Update our mock data
                this.mockPriceChanges[index] = change;

                return {
                    data: {
                        seller,
                        priceChange: change
                    }
                } as MessageEvent;
            })
        );
    }
}