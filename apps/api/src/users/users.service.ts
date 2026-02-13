import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        const { password, ...rest } = createUserDto;
        const passwordHash = await argon2.hash(password);

        try {
            const user = await this.prisma.user.create({
                data: {
                    ...rest,
                    passwordHash,
                },
            });
            const { passwordHash: hash, ...result } = user;
            return result;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictException('Email already exists');
            }
            throw error;
        }
    }

    async findAll() {
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return users.map(user => {
            const { passwordHash, ...result } = user;
            return result;
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) throw new NotFoundException('User not found');
        const { passwordHash, ...result } = user;
        return result;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const { password, ...rest } = updateUserDto;

        const data: any = { ...rest };

        if (password) {
            data.passwordHash = await argon2.hash(password);
        }

        const user = await this.prisma.user.update({
            where: { id },
            data,
        });

        const { passwordHash, ...result } = user;
        return result;
    }


    async remove(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }
}
