import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('shops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopsController {
    constructor(private readonly shopsService: ShopsService) { }

    @Post()
    @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
    create(@Body() createShopDto: CreateShopDto) {
        return this.shopsService.create(createShopDto);
    }

    @Get()
    findAll(@Query('brandId') brandId: string) {
        return this.shopsService.findAll(brandId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.shopsService.findOne(id);
    }

    @Patch(':id')
    @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
    update(@Param('id') id: string, @Body() updateShopDto: UpdateShopDto) {
        return this.shopsService.update(id, updateShopDto);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN', 'BRAND_ADMIN')
    remove(@Param('id') id: string) {
        return this.shopsService.remove(id);
    }
}
