import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
type SetupOptions = {
    enableSwagger?: boolean;
};
export declare function setupApp(app: INestApplication, options?: SetupOptions): void;
export declare function getApplicationPort(configService: ConfigService): number;
export {};
