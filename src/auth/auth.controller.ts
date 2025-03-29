import { Controller, Post, Body, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(
        @Body() loginDto: { username: string; password: string },
        @Res({ passthrough: true }) response: Response
    ) {
        try {
            const user = await this.authService.validateUser(
                loginDto.username,
                loginDto.password
            );

            const { access_token } = await this.authService.login(user);

            response.cookie('jwt', access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000,
            });

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            throw new UnauthorizedException(error.message);
        }
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie('jwt');
        return { success: true };
    }
}