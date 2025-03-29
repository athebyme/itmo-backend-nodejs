import { Injectable } from '@nestjs/common';
import { PriceChange, StockChange } from './stats.types';
import { SseService } from './sse.service';

@Injectable()
export class NotificationService {
    constructor(private readonly sseService: SseService) {}

    showPriceChangeNotification(priceChange: PriceChange): void {
        const isIncrease = priceChange.changePercent > 0;
        const changeType = isIncrease ? 'increased' : 'decreased';
        const absChangePercent = Math.abs(priceChange.changePercent).toFixed(1);

        console.log(
            `[PRICE NOTIFICATION] ${priceChange.productName} (${priceChange.vendorCode}) ` +
            `price ${changeType} by ${absChangePercent}%: ` +
            `${priceChange.oldPrice} → ${priceChange.newPrice}`
        );

        this.sseService.emitPriceChange(priceChange);
    }

    showStockChangeNotification(stockChange: StockChange): void {
        const isIncrease = stockChange.changePercent > 0;
        const changeType = isIncrease ? 'increased' : 'decreased';
        const absChangePercent = Math.abs(stockChange.changePercent).toFixed(1);

        console.log(
            `[STOCK NOTIFICATION] ${stockChange.productName} (${stockChange.vendorCode}) ` +
            `at ${stockChange.warehouseName} ${changeType} by ${absChangePercent}%: ` +
            `${stockChange.oldAmount} → ${stockChange.newAmount}`
        );

        // Emit SSE event
        this.sseService.emitStockChange(stockChange);
    }

    // General notification methods - these are for server-side logging
    showInfo(message: string, title: string = 'Info'): void {
        console.log(`[INFO] ${title}: ${message}`);
    }

    showSuccess(message: string, title: string = 'Success'): void {
        console.log(`[SUCCESS] ${title}: ${message}`);
    }

    showWarning(message: string, title: string = 'Warning'): void {
        console.log(`[WARNING] ${title}: ${message}`);
    }

    showError(message: string, title: string = 'Error'): void {
        console.error(`[ERROR] ${title}: ${message}`);
    }
}