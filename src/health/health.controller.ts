import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly database: DatabaseService) {}

  @Get('live')
  liveness() {
    this.logger.debug('Liveness probe invoked');
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness() {
    this.logger.debug('Readiness probe invoked');
    await this.database.ping();
    return { status: 'ok' };
  }
}
