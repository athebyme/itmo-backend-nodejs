import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.cookies?.jwt;

        if (!token) {
            throw new UnauthorizedException('Не авторизован');
        }

        try {
            const payload = this.jwtService.verify(token);
            const user = await this.usersService.findById(payload.sub);

            if (!user) {
                throw new UnauthorizedException('Пользователь не найден');
            }

            request.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            };

            return true;
        } catch (error) {
            throw new UnauthorizedException('Недействительный токен');
        }
    }
}