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
    brandId: string;

    @IsString()
    @IsOptional()
    customerId?: string;

    @IsString()
    @IsOptional()
    shopId?: string;

    @IsString()
    @IsOptional()
    salesPersonId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    discountAmount?: number;
}
