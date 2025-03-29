import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, catchError, map, of } from 'rxjs';
import {
    PaginatedPriceChanges,
    PaginatedStockChanges,
    PaginationQuery,
    PriceChangeFilter,
    StockChangeFilter
} from './stats.types';

@Injectable()
export class StatsService {
    private readonly apiBaseUrl = 'http://199.83.103.182/api/stats';

    constructor(private httpService: HttpService) {}

    /**
     * Get overview statistics
     */
    getOverviewStats(refresh: boolean = false): Observable<any> {
        let url = `${this.apiBaseUrl}/overview`;
        if (refresh) {
            url += `?refresh=true`;
        }

        return this.httpService.get(url).pipe(
            map(response => response.data),
            catchError(error => {
                console.error('Error fetching overview stats:', error);
                return of({ error: 'Failed to fetch overview statistics' });
            })
        );
    }

    /**
     * Get top products
     */
    getTopProducts(limit: number = 10, refresh: boolean = false): Observable<any> {
        let url = `${this.apiBaseUrl}/products?limit=${limit}`;
        if (refresh) {
            url += `&refresh=true`;
        }

        return this.httpService.get(url).pipe(
            map(response => response.data),
            catchError(error => {
                console.error('Error fetching top products:', error);
                return of([]);
            })
        );
    }

    /**
     * Get warehouse list
     */
    getWarehouses(): Observable<any> {
        return this.httpService.get(`${this.apiBaseUrl}/warehouses`).pipe(
            map(response => response.data),
            catchError(error => {
                console.error('Error fetching warehouses:', error);
                return of([]);
            })
        );
    }

    /**
     * Get price changes with pagination and filtering
     */
    getPriceChanges(
        query: PaginationQuery,
        filter: PriceChangeFilter = {}
    ): Observable<PaginatedPriceChanges> {
        const requestData = {
            limit: query.limit || 20,
            cursor: query.cursor,
            refresh: query.refresh || false,
            filter: filter
        };

        return this.httpService.post<PaginatedPriceChanges>(
            `${this.apiBaseUrl}/price-changes`,
            requestData
        ).pipe(
            map(response => response.data),
            catchError(error => {
                console.error('Error fetching price changes:', error);
                return of({
                    items: [],
                    hasMore: false,
                    totalCount: 0
                });
            })
        );
    }

    /**
     * Get stock changes with pagination and filtering
     */
    getStockChanges(
        query: PaginationQuery,
        filter: StockChangeFilter = {}
    ): Observable<PaginatedStockChanges> {
        const requestData = {
            limit: query.limit || 20,
            cursor: query.cursor,
            refresh: query.refresh || false,
            warehouseId: filter.warehouseId,
            minChangePercent: filter.minChangePercent,
            minChangeAmount: filter.minChangeAmount,
            since: filter.since
        };

        return this.httpService.post<PaginatedStockChanges>(
            `${this.apiBaseUrl}/stock-changes`,
            requestData
        ).pipe(
            map(response => response.data),
            catchError(error => {
                console.error('Error fetching stock changes:', error);
                return of({
                    items: [],
                    hasMore: false,
                    totalCount: 0
                });
            })
        );
    }

    /**
     * Send a test event (for testing SSE)
     */
    sendTestEvent(type: 'price-change' | 'stock-change'): Observable<any> {
        return this.httpService.get(
            `http://199.83.103.182/api/sse/test?type=${type}`,
            {
                headers: {
                    'X-API-Key': 'test-api-key'
                }
            }
        ).pipe(
            map(response => response.data),
            catchError(error => {
                console.error('Error sending test event:', error);
                return of({ success: false });
            })
        );
    }
}