import { Controller, Get, Render, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
interface UserData {
    id: number;
    username: string;
    email: string;
    role: string;
}
@Controller()
export class IndexController {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService
    ) {}

    @Get()
    @Render('index')
    async getIndexPage(@Req() request: Request) {
        let isAuthenticated = false;
        let user: UserData | null = null;

        const token = request.cookies?.jwt;
        if (token) {
            try {
                const payload = this.jwtService.verify(token);
                const userData = await this.usersService.findById(payload.sub);

                if (userData) {
                    isAuthenticated = true;
                    user = {
                        id: userData.id,
                        username: userData.username,
                        email: userData.email,
                        role: userData.role
                    };
                }
            } catch {
            }
        }

        return {
            layout: 'auth_layout',
            title: isAuthenticated ? 'Панель управления' : 'Авторизация',
            isAuthenticated,
            user,
            body_scripts: '<script src="./src/js/authorization.js"></script>',
            head_extra: '<link rel="stylesheet" href="./src/static/css/login.css">',
        };
    }
}