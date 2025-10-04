import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { InsertResult, UpdateResult, DeleteResult } from 'kysely';
import { DatabaseService } from '../database/database.service';
import type { UserRow, UserUpdate } from '../database/database.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';

interface MysqlErrorLike {
  code?: string;
  errno?: number;
  message: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.connection;
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    this.logger.log(`Creating user with email: ${dto.email}`);

    try {
      const passwordHash = await bcrypt.hash(dto.password, 12);

      const result: InsertResult = await this.db
        .insertInto('User')
        .values({
          email: dto.email,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
          passwordHash,
        })
        .executeTakeFirstOrThrow();

      const insertId = Number(result.insertId ?? 0);
      if (!insertId) {
        throw new Error('Failed to retrieve inserted user identifier');
      }

      const user = await this.findUserById(insertId);
      this.logger.log(`User created with ID: ${user.id}`);
      return new UserEntity(user);
    } catch (error: unknown) {
      const err = this.toError(error);
      this.logger.error(
        `Failed to create user with email ${dto.email}`,
        err.stack,
      );

      if (this.isDuplicateEntryError(error)) {
        throw new BadRequestException('Email already in use');
      }

      throw err;
    }
  }

  async findAll(query: PaginationQueryDto): Promise<UserEntity[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;

    this.logger.debug(`Fetching users page=${page} limit=${limit}`);

    try {
      const users: UserRow[] = await this.db
        .selectFrom('User')
        .selectAll()
        .orderBy('User.createdAt', 'desc')
        .offset((page - 1) * limit)
        .limit(limit)
        .execute();

      this.logger.debug(`Fetched ${users.length} users`);
      return users.map((user) => new UserEntity(user));
    } catch (error: unknown) {
      const err = this.toError(error);
      this.logger.error(
        `Failed to fetch users page=${page} limit=${limit}`,
        err.stack,
      );
      throw err;
    }
  }

  async findOne(id: number): Promise<UserEntity> {
    this.logger.debug(`Fetching user with id=${id}`);

    try {
      const user = await this.findUserById(id);
      return new UserEntity(user);
    } catch (error: unknown) {
      const err = this.toError(error);
      if (err instanceof NotFoundException) {
        throw err;
      }

      this.logger.error(`Failed to fetch user with id=${id}`, err.stack);
      throw err;
    }
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserEntity> {
    this.logger.log(`Updating user id=${id}`);

    const { password, email, firstName, lastName } = dto;
    const payload: UserUpdate = {};

    if (email !== undefined) {
      payload.email = email;
    }

    if (firstName !== undefined) {
      payload.firstName = firstName;
    }

    if (lastName !== undefined) {
      payload.lastName = lastName;
    }

    try {
      if (password) {
        payload.passwordHash = await bcrypt.hash(password, 12);
      }

      if (Object.keys(payload).length === 0) {
        throw new BadRequestException('No fields provided to update');
      }

      const result: UpdateResult = await this.db
        .updateTable('User')
        .set(payload)
        .where('User.id', '=', id)
        .executeTakeFirst();

      const changedRows = Number(result.numChangedRows ?? 0);
      if (!changedRows) {
        throw new NotFoundException('User not found');
      }

      const user = await this.findUserById(id);
      this.logger.log(`User id=${id} updated`);
      return new UserEntity(user);
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        this.logger.warn(`Failed update for user id=${id}: ${error.message}`);
        throw error;
      }

      const err = this.toError(error);
      this.logger.error(`Failed to update user id=${id}`, err.stack);

      if (this.isDuplicateEntryError(error)) {
        throw new BadRequestException('Email already in use');
      }

      throw err;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.warn(`Deleting user id=${id}`);

    try {
      const result: DeleteResult = await this.db
        .deleteFrom('User')
        .where('User.id', '=', id)
        .executeTakeFirst();

      const deletedRows = Number(result.numDeletedRows ?? 0);
      if (!deletedRows) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`User id=${id} deleted`);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Failed delete for user id=${id}: ${error.message}`);
        throw error;
      }

      const err = this.toError(error);
      this.logger.error(`Failed to delete user id=${id}`, err.stack);
      throw err;
    }
  }

  private async findUserById(id: number): Promise<UserRow> {
    const user = await this.db
      .selectFrom('User')
      .selectAll()
      .where('User.id', '=', id)
      .executeTakeFirst();

    if (!user) {
      this.logger.warn(`User not found id=${id}`);
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private toError(error: unknown): Error {
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

  private isDuplicateEntryError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const err = error as MysqlErrorLike;
    return err.code === 'ER_DUP_ENTRY' || err.errno === 1062;
  }
}
