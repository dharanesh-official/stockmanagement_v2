import { IsString, IsOptional } from 'class-validator';

export class CreateWarehouseDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsString()
    brandId: string;
}
