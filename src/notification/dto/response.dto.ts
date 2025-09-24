import { Expose } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class NotificationResponseDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  id: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  content: string;

  @IsNotEmpty()
  @IsBoolean()
  @Expose()
  isChecked: boolean;

  @IsDateString()
  @IsNotEmpty()
  @Expose()
  createdAt: string;

  @IsDateString()
  @IsNotEmpty()
  @Expose()
  updatedAt: string;
}
