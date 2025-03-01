import { Controller, Get, Render } from '@nestjs/common';

@Controller() // для index.html делаем корневой путь '/'
export class IndexController {
    @Get()
    @Render('index')
    getIndexPage() {
        return {
            layout: 'auth_layout', // Используем auth_layout для страницы авторизации
            title: 'Авторизация',
            body_scripts: '<script src="./src/js/authorization.js"></script>',
            head_extra: '<link rel="stylesheet" href="./src/static/css/login.css">', // Добавляем login.css в head
        };
    }
}