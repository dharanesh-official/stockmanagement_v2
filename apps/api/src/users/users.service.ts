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
        const { password, assignedShopIds, assignedBrandIds, assignedWarehouseIds, ...rest } = createUserDto;
        const passwordHash = await argon2.hash(password);

        try {
            const user = await this.prisma.user.create({
                data: {
                    ...rest,
                    passwordHash,
                    assignedShops: assignedShopIds ? { connect: assignedShopIds.map(id => ({ id })) } : undefined,
                    assignedBrands: assignedBrandIds ? { connect: assignedBrandIds.map(id => ({ id })) } : undefined,
                    assignedWarehouses: assignedWarehouseIds ? { connect: assignedWarehouseIds.map(id => ({ id })) } : undefined,
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
            include: {
                brand: true,
                assignedShops: true,
            }
        });
        return users.map(user => {
            const { passwordHash, ...result } = user;
            return result;
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                assignedShops: true,
                assignedBrands: true,
                assignedWarehouses: true,
                brand: true,
                assignedWarehouse: true
            }
        });
        if (!user) throw new NotFoundException('User not found');
        const { passwordHash, ...result } = user;
        return result;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const { password, assignedShopIds, assignedBrandIds, assignedWarehouseIds, ...rest } = updateUserDto;

        const data: any = { ...rest };

        if (password) {
            data.passwordHash = await argon2.hash(password);
        }

        if (assignedShopIds) {
            data.assignedShops = { set: assignedShopIds.map(id => ({ id })) };
        }
        if (assignedBrandIds) {
            data.assignedBrands = { set: assignedBrandIds.map(id => ({ id })) };
        }
        if (assignedWarehouseIds) {
            data.assignedWarehouses = { set: assignedWarehouseIds.map(id => ({ id })) };
        }

        const user = await this.prisma.user.update({
            where: { id },
            data,
            include: {
                assignedShops: true,
                assignedBrands: true,
                assignedWarehouses: true
            }
        });

        const { passwordHash, ...result } = user;
        return result;
    }

    async remove(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }
}
