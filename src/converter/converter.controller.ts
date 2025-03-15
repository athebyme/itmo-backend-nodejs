import { Controller, Get, Render } from '@nestjs/common';

@Controller('converter')
export class ConverterController {
    @Get()
    @Render('converter')
    getConverterPage() {
        return {
            layout: 'main_layout',
            title: 'Конвертер валют - Панель управления продавца',
            body_scripts: '<script src="src/js/loadTime.js"></script><script src="src/js/menuActive.js"></script><script src="src/js/converter.js"></script>',
            head_extra : '',
        };
    }
}