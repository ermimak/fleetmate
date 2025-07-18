import { IsNotEmpty, IsOptional } from 'class-validator';

export class LinkTelegramDto {
  @IsNotEmpty()
  telegramId: string;

  @IsOptional()
  telegramUsername?: string;
}
