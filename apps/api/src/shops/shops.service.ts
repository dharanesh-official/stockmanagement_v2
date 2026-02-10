import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createShopDto: CreateShopDto) {
        const { brandIds, ...shopData } = createShopDto;
        return this.prisma.shop.create({
            data: {
                ...shopData,
                brands: {
                    connect: brandIds.map((id) => ({ id })),
                },
            },
            include: { brands: true },
        });
    }

    async findAll(brandId?: string) {
        const where = brandId ? { brands: { some: { id: brandId } } } : {};
        return this.prisma.shop.findMany({
            where,
            include: { brands: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const shop = await this.prisma.shop.findUnique({
            where: { id },
        });
        if (!shop) throw new NotFoundException('Shop not found');
        return shop;
    }

    async update(id: string, updateShopDto: UpdateShopDto) {
        await this.findOne(id);
        const { brandIds, ...shopData } = updateShopDto;

        const data: any = { ...shopData };
        if (brandIds) {
            data.brands = {
                set: brandIds.map((id) => ({ id })),
            };
        }

        return this.prisma.shop.update({
            where: { id },
            data,
            include: { brands: true },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.shop.delete({
            where: { id },
        });
    }
}
