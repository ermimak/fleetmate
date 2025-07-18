"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async create(createUserDto) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.userRepository.save(user);
    }
    async findAll() {
        return this.userRepository.find({
            select: ['id', 'email', 'firstName', 'lastName', 'department', 'position', 'role', 'status', 'createdAt'],
        });
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'email', 'firstName', 'lastName', 'department', 'position', 'phoneNumber', 'role', 'status', 'managerId', 'telegramId', 'telegramUsername', 'createdAt', 'updatedAt'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email } });
    }
    async findByTelegramId(telegramId) {
        return this.userRepository.findOne({ where: { telegramId } });
    }
    async findByRole(role) {
        return this.userRepository.find({
            where: { role },
            select: ['id', 'email', 'firstName', 'lastName', 'department', 'position', 'role', 'status'],
        });
    }
    async findByDepartment(department) {
        return this.userRepository.find({
            where: { department },
            select: ['id', 'email', 'firstName', 'lastName', 'department', 'position', 'role', 'status'],
        });
    }
    async update(id, updateUserDto) {
        const user = await this.findOne(id);
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        await this.userRepository.update(id, updateUserDto);
        return this.findOne(id);
    }
    async remove(id) {
        const user = await this.findOne(id);
        await this.userRepository.remove(user);
    }
    async updateStatus(id, status) {
        await this.userRepository.update(id, { status });
        return this.findOne(id);
    }
    async updateTelegramInfo(id, telegramInfo) {
        await this.userRepository.update(id, telegramInfo);
        return this.findOne(id);
    }
    async getManagers() {
        return this.userRepository.find({
            where: [
                { role: user_entity_1.UserRole.AUTHORITY },
                { role: user_entity_1.UserRole.APPROVER },
                { role: user_entity_1.UserRole.ADMIN },
            ],
            select: ['id', 'firstName', 'lastName', 'department', 'position', 'role'],
        });
    }
    async getUserStats() {
        const totalUsers = await this.userRepository.count();
        const activeUsers = await this.userRepository.count({ where: { status: user_entity_1.UserStatus.ACTIVE } });
        const usersByRole = await this.userRepository
            .createQueryBuilder('user')
            .select('user.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .groupBy('user.role')
            .getRawMany();
        return {
            totalUsers,
            activeUsers,
            usersByRole,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map