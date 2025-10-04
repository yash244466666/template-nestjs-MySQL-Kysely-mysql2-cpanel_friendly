import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, MysqlDialect } from 'kysely';
import type { MysqlPool } from 'kysely';
import { createPool, Pool } from 'mysql2';
import type { Pool as PromisePool } from 'mysql2/promise';
import { ensureDatabaseExists } from './ensure-database';
import type { Database } from './database.types';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private db?: Kysely<Database>;
  private pool?: Pool;
  private promisePool?: PromisePool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const databaseUrl = this.configService.getOrThrow<string>('DATABASE_URL');
    const adminDatabaseUrl =
      this.configService.get<string>('DATABASE_ADMIN_URL');

    // Only run bootstrap in dev, or when an explicit admin URL is provided.
    // Shared cPanel users cannot CREATE DATABASE anyway.
    if (
      process.env.DISABLE_DB_BOOTSTRAP !== 'true' &&
      (process.env.NODE_ENV !== 'production' || adminDatabaseUrl)
    ) {
      await ensureDatabaseExists(databaseUrl, adminDatabaseUrl ?? undefined);
    }

    const url = new URL(databaseUrl);

    this.pool = createPool({
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

    const dialect = new MysqlDialect({
      // Kysely expects the callback-style mysql2 pool here.
      pool: this.pool as unknown as MysqlPool,
    });
    this.db = new Kysely<Database>({ dialect });

    this.logger.log('Connecting to MySQL database');
    await this.ping();
    this.logger.log('Database connection established');
  }

  get connection(): Kysely<Database> {
    if (!this.db) {
      throw new Error('Database connection has not been initialised');
    }
    return this.db;
  }

  async ping(): Promise<void> {
    if (!this.promisePool) {
      throw new Error('Database connection pool is not available');
    }

    await this.promisePool.query('SELECT 1');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing database connections');
    try {
      if (this.db) {
        await this.db.destroy();
      } else if (this.promisePool) {
        await this.promisePool.end();
      } else if (this.pool) {
        await new Promise<void>((resolve, reject) => {
          this.pool!.end((error) => (error ? reject(error) : resolve()));
        });
      }
      this.logger.log('Database connections closed');
    } catch (error) {
      this.logger.error(
        `Failed to close database connections: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    } finally {
      this.db = undefined;
      this.promisePool = undefined;
      this.pool = undefined;
    }
  }

  private async ensureSchema(pool: PromisePool): Promise<void> {
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
}
