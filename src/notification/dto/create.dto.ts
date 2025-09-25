import { NotificationType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsString()
  size?: string;
}
