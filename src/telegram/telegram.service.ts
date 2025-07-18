import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;
  private logger = new Logger('TelegramService');
  private readonly token: string;

  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    if (!this.token) {
      this.logger.warn('No Telegram bot token provided. Telegram notifications will be disabled.');
    } else {
      this.bot = new Telegraf(this.token);
    }
  }

  async onModuleInit() {
    if (this.bot) {
      try {
        const botInfo = await this.bot.telegram.getMe();
        this.logger.log(`Telegram bot initialized: @${botInfo.username}`);
      } catch (error) {
        this.logger.error(`Failed to initialize Telegram bot: ${error.message}`);
      }
    }
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.bot) {
      this.logger.warn('Telegram bot not initialized. Message not sent.');
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        this.logger.log(`Message sent to chat ${chatId}`);
        return;
      } catch (error) {
        retryCount++;
        const isNetworkError = error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND';
        
        if (isNetworkError && retryCount < maxRetries) {
          this.logger.warn(`Network error sending message to chat ${chatId}, retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        } else {
          this.logger.error(`Failed to send message to chat ${chatId} after ${retryCount} attempts: ${error.message}`);
          if (isNetworkError) {
            this.logger.error('Network connectivity issue with Telegram API. Please check your internet connection.');
          }
          break;
        }
      }
    }
  }

  async sendPhoto(chatId: string, photoUrl: string, caption?: string): Promise<void> {
    if (!this.bot) {
      this.logger.warn('Telegram bot not initialized. Photo not sent.');
      return;
    }

    try {
      await this.bot.telegram.sendPhoto(chatId, photoUrl, {
        caption,
        parse_mode: 'Markdown',
      });
      this.logger.log(`Photo sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to send photo to chat ${chatId}: ${error.message}`);
    }
  }

  async sendDocument(chatId: string, documentUrl: string, caption?: string): Promise<void> {
    if (!this.bot) {
      this.logger.warn('Telegram bot not initialized. Document not sent.');
      return;
    }

    try {
      await this.bot.telegram.sendDocument(chatId, documentUrl, {
        caption,
        parse_mode: 'Markdown',
      });
      this.logger.log(`Document sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to send document to chat ${chatId}: ${error.message}`);
    }
  }

  async sendLocation(chatId: string, latitude: number, longitude: number): Promise<void> {
    if (!this.bot) {
      this.logger.warn('Telegram bot not initialized. Location not sent.');
      return;
    }

    try {
      await this.bot.telegram.sendLocation(chatId, latitude, longitude);
      this.logger.log(`Location sent to chat ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to send location to chat ${chatId}: ${error.message}`);
    }
  }

  getBot(): Telegraf {
    return this.bot;
  }
}
