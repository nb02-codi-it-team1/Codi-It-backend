import { IsString, IsInt, IsDateString } from 'class-validator';

export class CartDto {
    @IsString()
    id: string;

    @IsString()
    buyerId: string;

    @IsInt()
    quantity: number;

    @IsDateString()
    createdAt: string;

    @IsDateString()
    updatedAt: string;
}