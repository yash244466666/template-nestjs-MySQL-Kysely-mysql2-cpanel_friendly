"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const database_service_1 = require("../database/database.service");
const user_entity_1 = require("./entities/user.entity");
let UsersService = UsersService_1 = class UsersService {
    constructor(database) {
        this.database = database;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    get db() {
        return this.database.connection;
    }
    async create(dto) {
        this.logger.log(`Creating user with email: ${dto.email}`);
        try {
            const passwordHash = await bcrypt.hash(dto.password, 12);
            const result = await this.db
                .insertInto('User')
                .values({
                email: dto.email,
                firstName: dto.firstName ?? null,
                lastName: dto.lastName ?? null,
                passwordHash,
            })
                .executeTakeFirstOrThrow();
            const insertId = Number(result.insertId ?? 0);
            if (!insertId) {
                throw new Error('Failed to retrieve inserted user identifier');
            }
            const user = await this.findUserById(insertId);
            this.logger.log(`User created with ID: ${user.id}`);
            return new user_entity_1.UserEntity(user);
        }
        catch (error) {
            const err = this.toError(error);
            this.logger.error(`Failed to create user with email ${dto.email}`, err.stack);
            if (this.isDuplicateEntryError(error)) {
                throw new common_1.BadRequestException('Email already in use');
            }
            throw err;
        }
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 25;
        this.logger.debug(`Fetching users page=${page} limit=${limit}`);
        try {
            const users = await this.db
                .selectFrom('User')
                .selectAll()
                .orderBy('User.createdAt', 'desc')
                .offset((page - 1) * limit)
                .limit(limit)
                .execute();
            this.logger.debug(`Fetched ${users.length} users`);
            return users.map((user) => new user_entity_1.UserEntity(user));
        }
        catch (error) {
            const err = this.toError(error);
            this.logger.error(`Failed to fetch users page=${page} limit=${limit}`, err.stack);
            throw err;
        }
    }
    async findOne(id) {
        this.logger.debug(`Fetching user with id=${id}`);
        try {
            const user = await this.findUserById(id);
            return new user_entity_1.UserEntity(user);
        }
        catch (error) {
            const err = this.toError(error);
            if (err instanceof common_1.NotFoundException) {
                throw err;
            }
            this.logger.error(`Failed to fetch user with id=${id}`, err.stack);
            throw err;
        }
    }
    async update(id, dto) {
        this.logger.log(`Updating user id=${id}`);
        const { password, email, firstName, lastName } = dto;
        const payload = {};
        if (email !== undefined) {
            payload.email = email;
        }
        if (firstName !== undefined) {
            payload.firstName = firstName;
        }
        if (lastName !== undefined) {
            payload.lastName = lastName;
        }
        try {
            if (password) {
                payload.passwordHash = await bcrypt.hash(password, 12);
            }
            if (Object.keys(payload).length === 0) {
                throw new common_1.BadRequestException('No fields provided to update');
            }
            const result = await this.db
                .updateTable('User')
                .set(payload)
                .where('User.id', '=', id)
                .executeTakeFirst();
            const changedRows = Number(result.numChangedRows ?? 0);
            if (!changedRows) {
                throw new common_1.NotFoundException('User not found');
            }
            const user = await this.findUserById(id);
            this.logger.log(`User id=${id} updated`);
            return new user_entity_1.UserEntity(user);
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException) {
                this.logger.warn(`Failed update for user id=${id}: ${error.message}`);
                throw error;
            }
            const err = this.toError(error);
            this.logger.error(`Failed to update user id=${id}`, err.stack);
            if (this.isDuplicateEntryError(error)) {
                throw new common_1.BadRequestException('Email already in use');
            }
            throw err;
        }
    }
    async remove(id) {
        this.logger.warn(`Deleting user id=${id}`);
        try {
            const result = await this.db
                .deleteFrom('User')
                .where('User.id', '=', id)
                .executeTakeFirst();
            const deletedRows = Number(result.numDeletedRows ?? 0);
            if (!deletedRows) {
                throw new common_1.NotFoundException('User not found');
            }
            this.logger.log(`User id=${id} deleted`);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                this.logger.warn(`Failed delete for user id=${id}: ${error.message}`);
                throw error;
            }
            const err = this.toError(error);
            this.logger.error(`Failed to delete user id=${id}`, err.stack);
            throw err;
        }
    }
    async findUserById(id) {
        const user = await this.db
            .selectFrom('User')
            .selectAll()
            .where('User.id', '=', id)
            .executeTakeFirst();
        if (!user) {
            this.logger.warn(`User not found id=${id}`);
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    toError(error) {
        if (error instanceof Error) {
            return error;
        }
        if (typeof error === 'string') {
            return new Error(error);
        }
        try {
            return new Error(JSON.stringify(error));
        }
        catch {
            return new Error(String(error));
        }
    }
    isDuplicateEntryError(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        const err = error;
        return err.code === 'ER_DUP_ENTRY' || err.errno === 1062;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map