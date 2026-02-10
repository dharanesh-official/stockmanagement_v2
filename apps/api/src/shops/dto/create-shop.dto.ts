import { IsNotEmpty, IsString, IsOptional, IsPhoneNumber, IsArray } from 'class-validator';

export class CreateShopDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    brandIds: string[];

    @IsString()
    @IsOptional()
    managerName?: string;

    @IsString()
    @IsOptional()
    email?: string;
}
