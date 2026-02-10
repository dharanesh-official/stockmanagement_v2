import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveStockDto {
    @IsString()
    productId: string;

    @IsString()
    warehouseId: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsString()
    batchNumber?: string;

    @IsOptional()
    @Type(() => Date)
    expiryDate?: Date;
}

export class TransferStockDto {
    @IsString()
    productId: string;

    @IsString()
    fromWarehouseId: string;

    @IsString()
    toWarehouseId: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsString()
    batchNumber?: string;
}

export class AdjustStockDto {
    @IsString()
    productId: string;

    @IsString()
    warehouseId: string;

    @Type(() => Number)
    @IsInt()
    quantity: number; // Can be negative for reduction

    @IsString()
    reason: string;

    @IsOptional()
    @IsString()
    batchNumber?: string;
}
