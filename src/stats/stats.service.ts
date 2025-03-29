import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, of } from 'rxjs';
import {
    OverviewStats,
    PaginatedPriceChanges,
    PaginatedStockChanges,
    PaginationQuery,
    PriceChangeFilter,
    StockChangeFilter,
    Warehouse
} from './stats.types';

@Injectable()
export class StatsService {
    private readonly apiUrl = '/api/stats';

    constructor(private httpService: HttpService) {}

    /**
     * Mock method for getting overview stats
     */
    getOverviewStats(refresh: boolean = false): Observable<OverviewStats> {
        // Mock implementation
        const mockData: OverviewStats = {
            totalProducts: 100,
            totalWarehouses: 5,
            avgPrice: 1500,
            totalStock: 2500,
            avgStock: 25,
            lastUpdated: new Date().toISOString(),
            mostExpensiveItem: 'Premium Product',
            cheapestItem: 'Budget Product',
            lowStockItems: 10,
            lowStockThreshold: 5
        };

        return of(mockData);
    }

    /**
     * Mock method for getting price changes
     */
    getPriceChanges(
        query: PaginationQuery,
        filter: PriceChangeFilter = {}
    ): Observable<PaginatedPriceChanges> {
        // Mock implementation
        const mockData: PaginatedPriceChanges = {
            items: [
                {
                    productId: 1,
                    productName: 'Test Product 1',
                    vendorCode: 'TP001',
                    oldPrice: 1000,
                    newPrice: 1200,
                    changeAmount: 200,
                    changePercent: 20,
                    date: new Date().toISOString()
                },
                {
                    productId: 2,
                    productName: 'Test Product 2',
                    vendorCode: 'TP002',
                    oldPrice: 2000,
                    newPrice: 1800,
                    changeAmount: -200,
                    changePercent: -10,
                    date: new Date().toISOString()
                }
            ],
            hasMore: false,
            totalCount: 2
        };

        return of(mockData);
    }

    /**
     * Mock method for getting stock changes
     */
    getStockChanges(
        query: PaginationQuery,
        filter: StockChangeFilter = {}
    ): Observable<PaginatedStockChanges> {
        // Mock implementation
        const mockData: PaginatedStockChanges = {
            items: [
                {
                    productId: 1,
                    productName: 'Test Product 1',
                    vendorCode: 'TP001',
                    warehouseId: 1,
                    warehouseName: 'Main Warehouse',
                    oldAmount: 50,
                    newAmount: 40,
                    changeAmount: -10,
                    changePercent: -20,
                    date: new Date().toISOString()
                }
            ],
            hasMore: false,
            totalCount: 1
        };

        return of(mockData);
    }

    /**
     * Mock method for getting warehouses
     */
    getWarehouses(): Observable<Warehouse[]> {
        // Mock implementation
        const mockData: Warehouse[] = [
            { id: 1, name: 'Main Warehouse' },
            { id: 2, name: 'Secondary Warehouse' }
        ];

        return of(mockData);
    }
}