import { Injectable } from '@nestjs/common';
import { PriceChange, StockChange } from './stats.types';

// Mock the toastr library
declare var toastr: any;

@Injectable()
export class NotificationService {
    showPriceChangeNotification(priceChange: PriceChange): void {
        console.log('Price change notification:', priceChange);
    }

    showStockChangeNotification(stockChange: StockChange): void {
        console.log('Stock change notification:', stockChange);
    }

    showInfo(message: string, title: string = 'Info'): void {
        console.log(`${title}: ${message}`);
    }

    showSuccess(message: string, title: string = 'Success'): void {
        console.log(`${title}: ${message}`);
    }

    showWarning(message: string, title: string = 'Warning'): void {
        console.log(`${title}: ${message}`);
    }

    showError(message: string, title: string = 'Error'): void {
        console.error(`${title}: ${message}`);
    }
}