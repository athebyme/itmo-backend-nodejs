import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/main')
  @Render('main')
  getMainPage() {
    return { title: 'Главная страница' };
  }
}
