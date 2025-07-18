import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { TelegramBotService } from './telegram-bot.service';
import { UsersModule } from '../users/users.module';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [UsersModule, forwardRef(() => RequestsModule)],
  providers: [TelegramService, TelegramBotService],
  controllers: [TelegramController],
  exports: [TelegramService, TelegramBotService],
})
export class TelegramModule {}
