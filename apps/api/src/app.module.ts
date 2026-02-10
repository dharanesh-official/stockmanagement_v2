import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { BrandsModule } from './brands/brands.module';
import { ProductsModule } from './products/products.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { OrdersModule } from './orders/orders.module';
import { SalespersonsModule } from './salespersons/salespersons.module';
import { CustomersModule } from './customers/customers.module';
import { StockModule } from './stock/stock.module';
import { ShopsModule } from './shops/shops.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, BrandsModule, ProductsModule, WarehousesModule, OrdersModule, SalespersonsModule, CustomersModule, StockModule, ShopsModule, InvoicesModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
