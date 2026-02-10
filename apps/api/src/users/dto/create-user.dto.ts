import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsString, MinLength, IsArray } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;

    @IsString()
    @IsOptional()
    brandId?: string;

    @IsString()
    @IsOptional()
    assignedWarehouseId?: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    assignedShopIds?: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    assignedBrandIds?: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    assignedWarehouseIds?: string[];
}
