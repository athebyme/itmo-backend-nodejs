import { Controller, Get, Render, Query, Sse } from '@nestjs/common';
import { Observable, interval, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

@Controller('stats')
export class StatsController {
    private readonly priceChanges = [
        {
            productName: 'Стимулятор ануса с креплением',
            vendorCode: 'id-10167-1366',
            oldPrice: 2854,
            newPrice: 5647,
            changeAmount: 2793,
            changePercent: 97.8,
            date: new Date().toISOString()
        },
        {
            productName: 'Эластичный костюм',
            vendorCode: 'id-19527-1366',
            oldPrice: 1980,
            newPrice: 3755,
            changeAmount: 1775,
            changePercent: 89.6,
            date: new Date().toISOString()
        }
    ];

    @Get()
    @Render('stats')
    getStatsPage(@Query('seller') seller: string = 'bananzza') {
        return {
            layout: 'main_layout',
            title: 'Статистика изменений - Панель управления продавца',
            body_scripts: `
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script src="src/js/stats.js"></script>
                <script src="src/js/stats-sse.js"></script>
                <script src="src/js/loadTime.js"></script>
                <script src="src/js/menuActive.js"></script>
            `,
            head_extra: '<link rel="stylesheet" href="src/static/css/stats.css">',
            seller: seller
        };
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
}