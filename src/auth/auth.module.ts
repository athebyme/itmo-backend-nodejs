import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/user.service';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'crazybob',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UsersService],
    exports: [AuthService],
})
export class AuthModule {}