import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UsePipes, ValidationPipe, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_PERSON', 'FINANCE_MANAGER')
  findAll(
    @Query('brandId') brandId: string,
    @Query('salesPersonId') salesPersonId: string,
    @Query('status') status: OrderStatus,
    @Req() req: any,
  ) {
    if (req.user.role === 'SALES_PERSON') {
      // Salesperson can only see their own orders
      return this.ordersService.findAll(brandId, req.user.sub, status);
    }
    return this.ordersService.findAll(brandId, salesPersonId, status);
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'FINANCE_MANAGER')
  getStats(@Query('brandId') brandId?: string) {
    return this.ordersService.getOrderStats(brandId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER', 'SALES_PERSON', 'FINANCE_MANAGER')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
