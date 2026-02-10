import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) { }

  async create(createBrandDto: CreateBrandDto) {
    try {
      return await this.prisma.brand.create({
        data: createBrandDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Brand with this slug already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.brand.findMany({
      include: {
        _count: {
          select: {
            products: true,
            warehouses: true,
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: true,
        warehouses: true,
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    try {
      return await this.prisma.brand.update({
        where: { id },
        data: updateBrandDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Brand with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Brand with this slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.brand.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Brand with ID ${id} not found`);
      }
      throw error;
    }
  }
}
