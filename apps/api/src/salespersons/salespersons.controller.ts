import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SalespersonsService } from './salespersons.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('salespersons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SALES_PERSON', 'SUPER_ADMIN', 'BRAND_ADMIN')
export class SalespersonsController {
  constructor(private readonly salespersonsService: SalespersonsService) { }

  @Get('assigned-shops')
  getAssignedShops(@Req() req) {
    if (req.user.role === 'SUPER_ADMIN') {
      return this.salespersonsService.getAllShops();
    }
    return this.salespersonsService.getAssignedShops(req.user.sub);
  }

  @Get('shops/:shopId/brands')
  getShopBrands(@Req() req, @Param('shopId') shopId: string) {
    if (req.user.role === 'SUPER_ADMIN') {
      return this.salespersonsService.getShopBrandsDirectly(shopId);
    }
    return this.salespersonsService.getShopBrands(req.user.sub, shopId);
  }

  @Get('brands/:brandId/products')
  getBrandProducts(@Param('brandId') brandId: string) {
    return this.salespersonsService.getBrandProducts(brandId);
  }

  @Post('orders')
  placeOrder(@Req() req, @Body() createOrderDto: CreateOrderDto) {
    return this.salespersonsService.placeOrder(req.user.sub, createOrderDto);
  }
}
