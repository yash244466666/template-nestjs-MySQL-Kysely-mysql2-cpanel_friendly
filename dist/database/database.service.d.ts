import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely } from 'kysely';
import type { Database } from './database.types';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private db?;
    private pool?;
    private promisePool?;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    get connection(): Kysely<Database>;
    ping(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private ensureSchema;
}
