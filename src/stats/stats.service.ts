import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

// Simple interfaces for our data
interface PriceChange {
    productId: number;
    productName: string;
    vendorCode: string;
    oldPrice: number;
    newPrice: number;
    changeAmount: number;
    changePercent: number;
    date: string;
}

@Injectable()
export class StatsService {
    constructor(private httpService: HttpService) {}

    // Sample data methods
    getPriceChanges(): PriceChange[] {
        return [
            {
                productId: 1,
                productName: 'Test Product 1',
                vendorCode: 'ABC123',
                oldPrice: 2000,
                newPrice: 2500,
                changeAmount: 500,
                changePercent: 25,
                date: new Date().toISOString()
            },
            {
                productId: 2,
                productName: 'Test Product 2',
                vendorCode: 'DEF456',
                oldPrice: 1500,
                newPrice: 1200,
                changeAmount: -300,
                changePercent: -20,
                date: new Date().toISOString()
            }
        ];
    }

    // Method to fetch data from your Go backend (if needed)
    async fetchDataFromGoBackend(endpoint: string) {
        try {
            // Assuming your Go backend is available at this URL
            const response = await this.httpService.get(`http://your-go-backend/api/${endpoint}`).toPromise();
            return response.data;
        } catch (error) {
            console.error(`Error fetching data from Go backend: ${error.message}`);
            // Return sample data as fallback
            return this.getPriceChanges();
        }
    }
}