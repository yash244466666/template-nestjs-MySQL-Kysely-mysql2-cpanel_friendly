import { DatabaseService } from '../database/database.service';
export declare class HealthController {
    private readonly database;
    private readonly logger;
    constructor(database: DatabaseService);
    liveness(): {
        status: string;
    };
    readiness(): Promise<{
        status: string;
    }>;
}
