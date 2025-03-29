import { Injectable } from '@nestjs/common';

// Define the user type
interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    role: string;
}

@Injectable()
export class UsersService {
    private users: User[] = [
        {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            password: '123', // 'password'
            role: 'admin'
        }
    ];

    async findByUsername(username: string): Promise<User | undefined> {
        return this.users.find(user => user.username === username);
    }

    async findById(id: number): Promise<User | undefined> {
        return this.users.find(user => user.id === id);
    }
}