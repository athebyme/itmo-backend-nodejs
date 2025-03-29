import { Controller, Get, Query, Sse, Res } from '@nestjs/common';
import { Observable, interval, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Response } from 'express';

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
        <link rel="stylesheet" href="/src/static/css/sse.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>
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
}