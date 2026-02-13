import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { SalespersonsModule } from './salespersons/salespersons.module';
import { CustomersModule } from './customers/customers.module';
import { StockModule } from './stock/stock.module';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PrismaModule,
    ProductsModule,
    OrdersModule,
    SalespersonsModule,
    CustomersModule,
    StockModule,
    FinanceModule,
  ],

  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
