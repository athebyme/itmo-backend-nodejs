import { Controller, Get, Render } from '@nestjs/common';

@Controller('products')
export class ProductsController {
    @Get()
    @Render('products')
    getProductsPage() {
        return {
            layout: 'main_layout',
            title: 'Управление товарами - Панель управления продавца',
            body_scripts: `
                <script src="src/js/products.js" type="module"></script>
                <script src="src/js/loadTime.js"></script>
                <script src="src/js/menuActive.js"></script>
            `,
            head_extra: '<link rel="stylesheet" href="src/static/css/products.css">',
        };
    }
}