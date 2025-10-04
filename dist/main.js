"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const setup_app_1 = require("./config/setup-app");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    (0, setup_app_1.setupApp)(app);
    app.enableShutdownHooks();
    const configService = app.get(config_1.ConfigService);
    const port = (0, setup_app_1.getApplicationPort)(configService);
    await app.listen(port);
    const url = await app.getUrl();
    console.info(`Application running on ${url}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map