import { Controller, Get, Render } from '@nestjs/common';

@Controller('articul-parser')
export class ArticulParserController {
    @Get()
    @Render('articul-parser')
    getArticulParserPage() {
        return {
            layout: 'main_layout',
            title: 'Тестирование парсера артикулов',
            body_scripts: '<script src="src/js/articul-parser.js"></script><script src="src/js/loadTime.js"></script><script src="src/js/menuActive.js"></script>',
            head_extra: '',
        };
    }
}