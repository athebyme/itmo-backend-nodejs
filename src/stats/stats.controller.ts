import { Controller, Get, Query, Res } from '@nestjs/common';
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

    private readonly stockChanges = [
        {
            productName: 'Товар для тестирования остатков 1',
            vendorCode: 'id-10167-1366',
            warehouseId: 575679,
            warehouseName: 'Склад SPB',
            oldAmount: 100,
            newAmount: 120,
            changeAmount: 20,
            changePercent: 20,
            date: new Date().toISOString()
        },
        {
            productName: 'Товар для тестирования остатков 2',
            vendorCode: 'id-19527-1366',
            warehouseId: 575682,
            warehouseName: 'Склад MSK',
            oldAmount: 50,
            newAmount: 30,
            changeAmount: -20,
            changePercent: -40,
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
            seller: seller,
            priceChanges: this.priceChanges,
            stockChanges: this.stockChanges
        });
    }
}