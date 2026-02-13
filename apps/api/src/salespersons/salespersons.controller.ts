import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SalespersonsService } from './salespersons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('salespersons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalespersonsController {
  constructor(private readonly salespersonsService: SalespersonsService) { }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.salespersonsService.findAll();
  }

  @Get(':id/performance')
  @Roles(UserRole.ADMIN, UserRole.SALES_PERSON)
  getPerformance(@Param('id') id: string) {
    return this.salespersonsService.getPerformance(id);
  }
}

