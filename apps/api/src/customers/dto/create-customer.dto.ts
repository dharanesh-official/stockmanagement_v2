import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateCustomerDto {
    @IsString()
    fullName: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsString()
    brandId: string;
}
