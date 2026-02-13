import { IsString, IsNumber, IsEnum, IsArray, ValidateNested, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class OrderItemDto {
    @IsString()
    productId: string;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    quantity: number;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    unitPrice: number;
}

export class CreateOrderDto {
    @IsString()
    customerId: string;

    @IsString()
    @IsOptional()
    salesPersonId?: string;

    @IsEnum(OrderStatus)
    @IsOptional()
    type?: OrderStatus;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    discountAmount?: number;
}

