import { Controller, Get, Render } from '@nestjs/common';

@Controller('wildberries')
export class WildberriesController {
    @Get()
    @Render('wildberries')
    getWildberriesPage() {
        return {
            layout: 'main_layout',
            title: 'Товары Wildberries',
            body_scripts: '<script src="src/js/wildberries.js"></script><script src="src/js/menuActive.js"></script>',
            head_extra: '',
        };
    }
}