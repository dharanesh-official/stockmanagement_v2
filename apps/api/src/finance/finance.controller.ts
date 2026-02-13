import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Post('payments')
    @Roles(UserRole.ADMIN, UserRole.SALES_PERSON)
    create(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
        // If not provided, set the collector as the current user
        if (!createPaymentDto.collectedById) {
            createPaymentDto.collectedById = req.user.id;
        }
        return this.financeService.recordPayment(createPaymentDto);
    }

    @Get('payments')
    @Roles(UserRole.ADMIN)
    findAllPayments() {
        return this.financeService.findAllPayments();
    }

    @Get('bill-dues')
    @Roles(UserRole.ADMIN)
    getBillDues() {
        return this.financeService.getBillDues();
    }
}
