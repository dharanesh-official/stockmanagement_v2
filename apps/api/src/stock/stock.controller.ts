import { Controller, Get, Post, Body, Query, UsePipes, ValidationPipe, UseGuards, BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class StockController {
  constructor(private readonly stockService: StockService) { }

  @Post('adjust')
  @Roles(UserRole.ADMIN)
  adjustStock(@Body() body: { productId: string, quantity: number, type: 'INCREASE' | 'REDUCE' }) {
    if (!body.productId || !body.quantity || !body.type) {
      throw new BadRequestException('productId, quantity, and type are required');
    }
    return this.stockService.adjustStock(body.productId, body.quantity, body.type);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.stockService.findAll();
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN)
  getLowStock() {
    return this.stockService.getLowStock();
  }
}

