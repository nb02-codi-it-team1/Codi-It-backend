import { Expose } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class NotificationResponseDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  id: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  userid: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  content: string;

  @IsNotEmpty()
  @IsString()
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
