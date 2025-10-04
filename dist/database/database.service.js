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
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kysely_1 = require("kysely");
const mysql2_1 = require("mysql2");
const ensure_database_1 = require("./ensure-database");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(DatabaseService_1.name);
    }
    async onModuleInit() {
        const databaseUrl = this.configService.getOrThrow('DATABASE_URL');
        const adminDatabaseUrl = this.configService.get('DATABASE_ADMIN_URL');
        if (process.env.DISABLE_DB_BOOTSTRAP !== 'true' &&
            (process.env.NODE_ENV !== 'production' || adminDatabaseUrl)) {
            await (0, ensure_database_1.ensureDatabaseExists)(databaseUrl, adminDatabaseUrl ?? undefined);
        }
        const url = new URL(databaseUrl);
        this.pool = (0, mysql2_1.createPool)({
            host: url.hostname,
            port: Number(url.port || '3306'),
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.replace(/^\//, ''),
            waitForConnections: true,
            connectionLimit: 5,
            namedPlaceholders: true,
        });
        this.promisePool = this.pool.promise();
        await this.ensureSchema(this.promisePool);
        if (!this.pool) {
            throw new Error('Database connection pool has not been initialised');
        }
        const dialect = new kysely_1.MysqlDialect({
            pool: this.pool,
        });
        this.db = new kysely_1.Kysely({ dialect });
        this.logger.log('Connecting to MySQL database');
        await this.ping();
        this.logger.log('Database connection established');
    }
    get connection() {
        if (!this.db) {
            throw new Error('Database connection has not been initialised');
        }
        return this.db;
    }
    async ping() {
        if (!this.promisePool) {
            throw new Error('Database connection pool is not available');
        }
        await this.promisePool.query('SELECT 1');
    }
    async onModuleDestroy() {
        this.logger.log('Closing database connections');
        try {
            if (this.db) {
                await this.db.destroy();
            }
            else if (this.promisePool) {
                await this.promisePool.end();
            }
            else if (this.pool) {
                await new Promise((resolve, reject) => {
                    this.pool.end((error) => (error ? reject(error) : resolve()));
                });
            }
            this.logger.log('Database connections closed');
        }
        catch (error) {
            this.logger.error(`Failed to close database connections: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
        finally {
            this.db = undefined;
            this.promisePool = undefined;
            this.pool = undefined;
        }
    }
    async ensureSchema(pool) {
        this.logger.log('Ensuring core database schema exists');
        await pool.query(`
      CREATE TABLE IF NOT EXISTS \`User\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`email\` VARCHAR(191) NOT NULL,
        \`firstName\` VARCHAR(191) NULL,
        \`lastName\` VARCHAR(191) NULL,
        \`passwordHash\` VARCHAR(191) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE INDEX \`User_email_key\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map