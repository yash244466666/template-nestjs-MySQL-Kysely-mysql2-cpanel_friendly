import { Logger } from '@nestjs/common';
import mysql from 'mysql2/promise';

const logger = new Logger('DatabaseBootstrap');

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(String(error));
  }
}

export async function ensureDatabaseExists(
  databaseUrl: string,
  adminDatabaseUrl?: string,
): Promise<void> {
  const connectionUrl = new URL(adminDatabaseUrl ?? databaseUrl);
  const targetUrl = new URL(databaseUrl);
  const database = targetUrl.pathname.replace(/^\//, '');

  if (!database) {
    return;
  }

  let connection: mysql.Connection | null = null;

  try {
    logger.log(
      `Ensuring database \`${database}\` exists using ${
        adminDatabaseUrl ? 'admin' : 'application'
      } credentials`,
    );
    connection = await mysql.createConnection({
      host: connectionUrl.hostname,
      port: Number(connectionUrl.port || '3306'),
      user: decodeURIComponent(connectionUrl.username),
      password: decodeURIComponent(connectionUrl.password),
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    logger.log(`Database \`${database}\` is ready`);
  } catch (error: unknown) {
    const err = toError(error);
    const help = adminDatabaseUrl
      ? 'Verify that the administrator credentials have permission to create databases.'
      : 'Consider supplying DATABASE_ADMIN_URL with credentials that can create databases.';
    logger.error(
      `Failed ensuring database \`${database}\`: ${err.message}`,
      err.stack,
    );
    throw new Error(
      `Failed to ensure database \`${database}\` exists. Make sure MySQL is reachable and credentials are correct.\n${help}\n${err.message}`,
    );
  } finally {
    if (connection) {
      await connection.end();
      logger.debug(`Closed bootstrap connection for database \`${database}\``);
    }
  }
}
