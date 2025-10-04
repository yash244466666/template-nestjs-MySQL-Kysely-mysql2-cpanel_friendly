"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabaseExists = ensureDatabaseExists;
const common_1 = require("@nestjs/common");
const promise_1 = __importDefault(require("mysql2/promise"));
const logger = new common_1.Logger('DatabaseBootstrap');
function toError(error) {
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
async function ensureDatabaseExists(databaseUrl, adminDatabaseUrl) {
    const connectionUrl = new URL(adminDatabaseUrl ?? databaseUrl);
    const targetUrl = new URL(databaseUrl);
    const database = targetUrl.pathname.replace(/^\//, '');
    if (!database) {
        return;
    }
    let connection = null;
    try {
        logger.log(`Ensuring database \`${database}\` exists using ${adminDatabaseUrl ? 'admin' : 'application'} credentials`);
        connection = await promise_1.default.createConnection({
            host: connectionUrl.hostname,
            port: Number(connectionUrl.port || '3306'),
            user: decodeURIComponent(connectionUrl.username),
            password: decodeURIComponent(connectionUrl.password),
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        logger.log(`Database \`${database}\` is ready`);
    }
    catch (error) {
        const err = toError(error);
        const help = adminDatabaseUrl
            ? 'Verify that the administrator credentials have permission to create databases.'
            : 'Consider supplying DATABASE_ADMIN_URL with credentials that can create databases.';
        logger.error(`Failed ensuring database \`${database}\`: ${err.message}`, err.stack);
        throw new Error(`Failed to ensure database \`${database}\` exists. Make sure MySQL is reachable and credentials are correct.\n${help}\n${err.message}`);
    }
    finally {
        if (connection) {
            await connection.end();
            logger.debug(`Closed bootstrap connection for database \`${database}\``);
        }
    }
}
//# sourceMappingURL=ensure-database.js.map