import { Module } from '@nestjs/common';
import { SalespersonsService } from './salespersons.service';
import { SalespersonsController } from './salespersons.controller';

import { InvoicesModule } from '../invoices/invoices.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule, InvoicesModule],
  controllers: [SalespersonsController],
  providers: [SalespersonsService],
})
export class SalespersonsModule { }
