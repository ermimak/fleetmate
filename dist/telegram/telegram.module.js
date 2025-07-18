"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramModule = void 0;
const common_1 = require("@nestjs/common");
const telegram_service_1 = require("./telegram.service");
const telegram_controller_1 = require("./telegram.controller");
const telegram_bot_service_1 = require("./telegram-bot.service");
const users_module_1 = require("../users/users.module");
const requests_module_1 = require("../requests/requests.module");
let TelegramModule = class TelegramModule {
};
exports.TelegramModule = TelegramModule;
exports.TelegramModule = TelegramModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, (0, common_1.forwardRef)(() => requests_module_1.RequestsModule)],
        providers: [telegram_service_1.TelegramService, telegram_bot_service_1.TelegramBotService],
        controllers: [telegram_controller_1.TelegramController],
        exports: [telegram_service_1.TelegramService, telegram_bot_service_1.TelegramBotService],
    })
], TelegramModule);
//# sourceMappingURL=telegram.module.js.map