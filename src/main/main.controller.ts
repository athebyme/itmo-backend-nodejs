import { Controller, Get, Render } from '@nestjs/common';

@Controller('main')
export class MainController {
    @Get()
    @Render('main')
    getMainPage() {
        return {
            layout: 'main_layout',
            title: 'Панель управления продавца',
            body_scripts: '<script src="./src/js/main.js"></script>' +
                '<script src="src/js/loadTime.js"></script>\n' +
                '<script src="src/js/menuActive.js"></script>\n',
            head_extra: '',
        };
    }
}