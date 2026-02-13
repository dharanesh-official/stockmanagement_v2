import { Module } from '@nestjs/common';
import { SalespersonsService } from './salespersons.service';
import { SalespersonsController } from './salespersons.controller';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],

  controllers: [SalespersonsController],
  providers: [SalespersonsService],
})
export class SalespersonsModule { }
