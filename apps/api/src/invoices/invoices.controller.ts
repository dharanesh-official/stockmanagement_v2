import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Get()
    @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'SALES_PERSON', 'FINANCE_MANAGER')
    findAll(@Req() req) {
        if (req.user.role === 'SALES_PERSON') {
            return this.invoicesService.findAll(req.user.sub);
        }
        return this.invoicesService.findAll();
    }

    @Get(':id')
    @Roles('SUPER_ADMIN', 'BRAND_ADMIN', 'SALES_PERSON', 'FINANCE_MANAGER')
    findOne(@Param('id') id: string) {
        return this.invoicesService.findOne(id);
    }
}
