import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) { }

  @Post()
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN')
  create(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.create(createWarehouseDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
  findAll(@Query('brandId') brandId?: string) {
    return this.warehousesService.findAll(brandId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
  findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id);
  }

  @Get(':id/stock')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
  getStock(@Param('id') id: string) {
    return this.warehousesService.getWarehouseStock(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN')
  update(@Param('id') id: string, @Body() updateWarehouseDto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, updateWarehouseDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN')
  remove(@Param('id') id: string) {
    return this.warehousesService.remove(id);
  }
}
