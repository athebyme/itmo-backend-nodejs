import { Injectable } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PriceChange, StockChange } from './stats.types';

@Injectable()
export class TestEventsService {
    constructor(private readonly notificationService: NotificationService) {}

    /**
     * Generate a random price change event
     */
    generateRandomPriceChange(): PriceChange {
        const oldPrice = Math.floor(Math.random() * 5000) + 1000;
        const changePercent = ((Math.random() * 30) + 5) * (Math.random() > 0.5 ? 1 : -1);
        const newPrice = Math.round(oldPrice * (1 + changePercent / 100));
        const changeAmount = newPrice - oldPrice;

        return {
            productId: Math.floor(Math.random() * 1000) + 1,
            productName: `Тестовый товар ${Math.floor(Math.random() * 100)}`,
            vendorCode: `id-${Math.floor(Math.random() * 100000)}-${Math.floor(Math.random() * 10000)}`,
            oldPrice,
            newPrice,
            changeAmount,
            changePercent,
            date: new Date().toISOString()
        };
    }

    /**
     * Generate a random stock change event
     */
    generateRandomStockChange(): StockChange {
        const oldAmount = Math.floor(Math.random() * 100) + 10;
        const changePercent = ((Math.random() * 50) + 10) * (Math.random() > 0.5 ? 1 : -1);
        const newAmount = Math.max(0, Math.round(oldAmount * (1 + changePercent / 100)));
        const changeAmount = newAmount - oldAmount;

        // Sample warehouse data
        const warehouseOptions = [
            { id: 575679, name: 'Склад SPB' },
            { id: 575682, name: 'Склад MSK' },
            { id: 507123, name: 'Склад RND' },
            { id: 117501, name: 'Склад VLD' }
        ];

        const warehouse = warehouseOptions[Math.floor(Math.random() * warehouseOptions.length)];

        return {
            productId: Math.floor(Math.random() * 1000) + 1,
            productName: `Тестовый товар ${Math.floor(Math.random() * 100)}`,
            vendorCode: `id-${Math.floor(Math.random() * 100000)}-${Math.floor(Math.random() * 10000)}`,
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            oldAmount,
            newAmount,
            changeAmount,
            changePercent: parseFloat(((newAmount - oldAmount) / oldAmount * 100).toFixed(1)),
            date: new Date().toISOString()
        };
    }

    /**
     * Send a test price change notification
     */
    sendTestPriceChange(): PriceChange {
        const priceChange = this.generateRandomPriceChange();
        this.notificationService.showPriceChangeNotification(priceChange);
        return priceChange;
    }

    /**
     * Send a test stock change notification
     */
    sendTestStockChange(): StockChange {
        const stockChange = this.generateRandomStockChange();
        this.notificationService.showStockChangeNotification(stockChange);
        return stockChange;
    }

    /**
     * Start sending random events at intervals for testing
     * @param interval Interval in milliseconds (default: 10000ms)
     * @returns Function to stop the interval
     */
    startRandomEvents(interval = 10000): () => void {
        const intervalId = setInterval(() => {
            // 60% chance for price change, 40% chance for stock change
            if (Math.random() < 0.6) {
                this.sendTestPriceChange();
            } else {
                this.sendTestStockChange();
            }
        }, interval);

        return () => {
            clearInterval(intervalId);
        };
    }
}