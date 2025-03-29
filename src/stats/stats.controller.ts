import { Controller, Get, Post, Query, Body, Param, Sse, Res } from '@nestjs/common';
import { Observable, interval, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Response } from 'express';
import { StatsService } from '/stats.service';
import {
    PaginationQuery,
    PriceChangeFilter,
    StockChangeFilter
} from '/stats.types';

@Controller('stats')
export class StatsController {
    private readonly priceChanges = [
        {
            productName: 'Товар для тестирования цен 1',
            vendorCode: 'id-10167-1366',
            oldPrice: 2854,
            newPrice: 5647,
            changeAmount: 2793,
            changePercent: 97.8,
            date: new Date().toISOString()
        },
        {
            productName: 'Товар для тестирования цен 2',
            vendorCode: 'id-19527-1366',
            oldPrice: 1980,
            newPrice: 3755,
            changeAmount: 1775,
            changePercent: 89.6,
            date: new Date().toISOString()
        }
    ];

    constructor(
        private readonly statsService: StatsService
    ) {}

    @Get()
    getStatsPage(@Query('seller') seller: string = 'default', @Res() res: Response) {
        return res.render('stats', {
            layout: 'layouts/main_layout',
            title: 'Статистика изменений - Панель управления продавца',
            body_scripts: `
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="/src/js/stats.js"></script>
      <script src="/src/js/stats-sse.js"></script> 
      <script src="/src/js/loadTime.js"></script>
      <script src="/src/js/menuActive.js"></script>
    `,
            head_extra: `
      <link rel="stylesheet" href="/static/css/stats.css">
      <link rel="stylesheet" href="/static/css/sse.css">
    `,
            seller: seller
        });
    }

    @Sse('price-changes-stream')
    priceChangesStream(): Observable<MessageEvent> {
        return interval(5000).pipe(
            mergeMap(() => {
                const baseChange = this.priceChanges[Math.floor(Math.random() * this.priceChanges.length)];

                const oldPrice = baseChange.oldPrice + Math.floor(Math.random() * 500) - 250;
                const changeAmount = Math.floor(Math.random() * 1000) - 250;
                const newPrice = oldPrice + changeAmount;
                const changePercent = (changeAmount / oldPrice) * 100;

                const data = {
                    productId: Math.floor(Math.random() * 5000) + 1,
                    productName: baseChange.productName,
                    vendorCode: baseChange.vendorCode,
                    oldPrice,
                    newPrice,
                    changeAmount,
                    changePercent,
                    date: new Date().toISOString()
                };

                console.log('SSE: отправляю новое изменение цены', data);

                return of({
                    data: JSON.stringify(data)
                } as MessageEvent);
            })
        );
    }

    @Get('overview')
    getOverviewStats(@Query('refresh') refresh: boolean = false) {
        return this.statsService.getOverviewStats(refresh);
    }

    @Get('products')
    getTopProducts(
        @Query('limit') limit: number = 10,
        @Query('refresh') refresh: boolean = false
    ) {
        return this.statsService.getTopProducts(limit, refresh);
    }

    @Get('warehouses')
    getWarehouses() {
        return this.statsService.getWarehouses();
    }

    @Post('price-changes')
    getPriceChanges(
        @Body() body: { limit: number; cursor?: string; refresh?: boolean; filter?: PriceChangeFilter }
    ) {
        const { limit, cursor, refresh, filter } = body;
        const query: PaginationQuery = { limit, cursor, refresh };
        return this.statsService.getPriceChanges(query, filter || {});
    }

    @Post('stock-changes')
    getStockChanges(
        @Body() body: {
            limit: number;
            cursor?: string;
            refresh?: boolean;
            warehouseId?: number;
            minChangePercent?: number;
            minChangeAmount?: number;
            since?: string;
        }
    ) {
        const { limit, cursor, refresh, ...filterParams } = body;
        const query: PaginationQuery = { limit, cursor, refresh };
        const filter: StockChangeFilter = filterParams;
        return this.statsService.getStockChanges(query, filter);
    }

    @Get('price-history/:id')
    getPriceHistory(
        @Param('id') id: string,
        @Query('days') days: number = 30
    ) {
        return this.statsService.getPriceHistory(Number(id), days);
    }

    @Get('stock-history/:id/:warehouseId')
    getStockHistory(
        @Param('id') id: string,
        @Param('warehouseId') warehouseId: string,
        @Query('days') days: number = 30
    ) {
        return this.statsService.getStockHistory(
            Number(id),
            Number(warehouseId),
            days
        );
    }

    @Post('refresh-cache')
    refreshCache() {
        return this.statsService.refreshCache();
    }
}