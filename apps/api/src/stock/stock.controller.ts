import { Controller, Get, Post, Body, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { ReceiveStockDto, TransferStockDto, AdjustStockDto } from './dto/stock-operations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class StockController {
  constructor(private readonly stockService: StockService) { }

  @Post('receive')
  @Roles('SUPER_ADMIN', 'WAREHOUSE_MANAGER')
  receiveStock(@Body() receiveStockDto: ReceiveStockDto) {
    return this.stockService.receiveStock(receiveStockDto);
  }

  @Post('transfer')
  @Roles('SUPER_ADMIN', 'WAREHOUSE_MANAGER')
  transferStock(@Body() transferStockDto: TransferStockDto) {
    return this.stockService.transferStock(transferStockDto);
  }

  @Post('adjust')
  @Roles('SUPER_ADMIN', 'WAREHOUSE_MANAGER')
  adjustStock(@Body() adjustStockDto: AdjustStockDto) {
    return this.stockService.adjustStock(adjustStockDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
  findAll(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.stockService.findAll(productId, warehouseId);
  }

  @Get('low-stock')
  @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'WAREHOUSE_MANAGER')
  getLowStock(@Query('brandId') brandId?: string) {
    return this.stockService.getLowStock(brandId);
  }
}
