import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
    @IsString()
    orderId: string;

    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsString()
    paymentMethod: string;

    @IsOptional()
    @IsString()
    reference?: string;

    @IsString()
    @IsOptional()
    collectedById?: string;
}
