import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    OverviewStats,
    PaginatedPriceChanges,
    PaginatedStockChanges,
    PaginationQuery,
    PriceChangeFilter,
    PriceHistoryItem,
    ProductStats,
    StockChangeFilter,
    StockHistoryItem,
    Warehouse
} from '/stats.types';

@Injectable({
    providedIn: 'root'
})
export class StatsService {
    private readonly apiUrl = '/api/stats';

    constructor(private http: HttpClient) {}

    /**
     * Получение общей статистики
     */
    getOverviewStats(refresh: boolean = false): Observable<OverviewStats> {
        let params = new HttpParams();
        if (refresh) {
            params = params.set('refresh', 'true');
        }

        return this.http.get<OverviewStats>(`${this.apiUrl}/overview`, { params });
    }

    /**
     * Получение списка топовых продуктов
     */
    getTopProducts(limit: number = 10, refresh: boolean = false): Observable<ProductStats[]> {
        let params = new HttpParams()
            .set('limit', limit.toString());

        if (refresh) {
            params = params.set('refresh', 'true');
        }

        return this.http.get<ProductStats[]>(`${this.apiUrl}/products`, { params });
    }

    /**
     * Получение списка складов
     */
    getWarehouses(): Observable<Warehouse[]> {
        return this.http.get<Warehouse[]>(`${this.apiUrl}/warehouses`);
    }

    /**
     * Получение изменений цен с пагинацией и фильтрацией
     */
    getPriceChanges(
        query: PaginationQuery,
        filter: PriceChangeFilter = {}
    ): Observable<PaginatedPriceChanges> {
        return this.http.post<PaginatedPriceChanges>(`${this.apiUrl}/price-changes`, {
            limit: query.limit,
            cursor: query.cursor,
            refresh: query.refresh,
            filter
        });
    }

    /**
     * Получение изменений остатков с пагинацией и фильтрацией
     */
    getStockChanges(
        query: PaginationQuery,
        filter: StockChangeFilter = {}
    ): Observable<PaginatedStockChanges> {
        return this.http.post<PaginatedStockChanges>(`${this.apiUrl}/stock-changes`, {
            limit: query.limit,
            cursor: query.cursor,
            refresh: query.refresh,
            warehouseId: filter.warehouseId,
            minChangePercent: filter.minChangePercent,
            minChangeAmount: filter.minChangeAmount,
            since: filter.since
        });
    }

    /**
     * Получение истории цен для товара
     */
    getPriceHistory(productId: number, days: number = 30): Observable<PriceHistoryItem[]> {
        let params = new HttpParams()
            .set('days', days.toString());

        return this.http.get<PriceHistoryItem[]>(`${this.apiUrl}/price-history/${productId}`, { params });
    }

    /**
     * Получение истории остатков для товара на складе
     */
    getStockHistory(productId: number, warehouseId: number, days: number = 30): Observable<StockHistoryItem[]> {
        let params = new HttpParams()
            .set('days', days.toString());

        return this.http.get<StockHistoryItem[]>(
            `${this.apiUrl}/stock-history/${productId}/${warehouseId}`,
            { params }
        );
    }

    /**
     * Обновить кэш статистики
     */
    refreshCache(): Observable<{success: boolean, message: string}> {
        return this.http.post<{success: boolean, message: string}>(`${this.apiUrl}/refresh-cache`, {});
    }

    /**
     * Отправить тестовое событие SSE
     * (используется только для отладки)
     */
    sendTestEvent(type: 'price-change' | 'stock-change'): Observable<{success: boolean}> {
        const params = new HttpParams().set('type', type);

        return this.http.get<{success: boolean}>('/api/sse/test', {
            params,
            headers: {
                'X-API-Key': 'test-api-key'
            }
        });
    }
}