import { IsString, IsOptional, IsEnum } from 'class-validator';
import { BrandStatus } from '@prisma/client';

export class CreateBrandDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsOptional()
    @IsString()
    logoUrl?: string;


    @IsOptional()
    @IsEnum(BrandStatus)
    status?: BrandStatus;
}
