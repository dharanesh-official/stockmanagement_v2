import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES_PERSON)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES_PERSON)
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES_PERSON)
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/history')
  @Roles(UserRole.ADMIN, UserRole.SALES_PERSON)
  getPurchaseHistory(@Param('id') id: string) {
    return this.customersService.getPurchaseHistory(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES_PERSON)
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Patch(':id/toggle-lock')
  @Roles(UserRole.ADMIN)
  toggleLock(@Param('id') id: string, @Body('isLocked') isLocked: boolean) {
    return this.customersService.toggleLock(id, isLocked);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}

