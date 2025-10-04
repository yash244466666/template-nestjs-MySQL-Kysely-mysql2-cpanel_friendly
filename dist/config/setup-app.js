'use strict';
Object.defineProperty (exports, '__esModule', {value: true});
exports.setupApp = setupApp;
exports.getApplicationPort = getApplicationPort;
const common_1 = require ('@nestjs/common');
const core_1 = require ('@nestjs/core');
const swagger_1 = require ('@nestjs/swagger');
function setupApp (app, options = {enableSwagger: true}) {
  const reflector = app.get (core_1.Reflector);
  app.setGlobalPrefix ('api');
  app.enableVersioning ({type: common_1.VersioningType.URI});
  app.useGlobalPipes (
    new common_1.ValidationPipe ({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {enableImplicitConversion: true},
    })
  );
  app.useGlobalInterceptors (
    new common_1.ClassSerializerInterceptor (reflector)
  );
  app.enableCors ();
  if (options.enableSwagger) {
    const swaggerConfig = new swagger_1.DocumentBuilder ()
      .setTitle ('nestjs+MySQL+Kysely+mysql2-cpanel_friendly')
      .setDescription (
        'REST API documentation for nestjs+MySQL+Kysely+mysql2-cpanel_friendly'
      )
      .setVersion ('1.0.0')
      .build ();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument (
      app,
      swaggerConfig
    );
    swagger_1.SwaggerModule.setup ('docs', app, swaggerDocument);
  }
}
function getApplicationPort (configService) {
  return configService.get ('APP_PORT', 3000);
}
//# sourceMappingURL=setup-app.js.map
