import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UsePipes, ValidationPipe, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES_PERSON)
  create(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    if (!createOrderDto.salesPersonId) {
      createOrderDto.salesPersonId = req.user.id;
    }
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES_PERSON)
  findAll(
    @Query('type') type: OrderStatus,
    @Query('salesPersonId') salesPersonId: string,
    @Req() req: any,
  ) {
    if (req.user.role === UserRole.SALES_PERSON) {
      return this.ordersService.findAll(type, req.user.id);
    }
    return this.ordersService.findAll(type, salesPersonId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.ordersService.getOrderStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES_PERSON)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}

