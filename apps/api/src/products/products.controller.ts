import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_PERSON')
  findAll(@Query('brandId') brandId?: string) {
    return this.productsService.findAll(brandId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_PERSON')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/stock')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_PERSON')
  getStock(@Param('id') id: string) {
    return this.productsService.getProductStock(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
