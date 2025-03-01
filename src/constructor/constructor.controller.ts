import { Controller, Get, Render } from '@nestjs/common';

@Controller('constructor')
export class ConstructorController {
    @Get()
    @Render('constructor')
    getConstructorPage() {
        return {
            title: 'Конструктор таблицы',
            body_scripts: '<script defer src="src/js/tableConstructor.js"></script><script defer src="src/js/menuActive.js"></script>',
        };
    }
}