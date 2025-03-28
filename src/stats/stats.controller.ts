import { Controller, Get, Render, Query } from '@nestjs/common';

@Controller('stats')
export class StatsController {
    @Get()
    @Render('stats')
    getStatsPage(@Query('seller') seller: string = 'bananzza') {
        return {
            layout: 'main_layout',
            title: 'Статистика изменений - Панель управления продавца',
            body_scripts: `
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script src="src/js/stats.js"></script>
                <script src="src/js/loadTime.js"></script>
                <script src="src/js/menuActive.js"></script>
            `,
            head_extra: '<link rel="stylesheet" href="src/static/css/stats.css">',
            seller: seller // Pass the seller parameter to the template
        };
    }
}