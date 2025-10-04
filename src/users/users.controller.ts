import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOkResponse({ type: UserEntity })
  create(@Body() dto: CreateUserDto): Promise<UserEntity> {
    this.logger.log('Received request to create user');
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: UserEntity, isArray: true })
  findAll(@Query() query: PaginationQueryDto): Promise<UserEntity[]> {
    this.logger.debug('Received request to list users');
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: UserEntity })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    this.logger.debug(`Received request to fetch user id=${id}`);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: UserEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserEntity> {
    this.logger.log(`Received request to update user id=${id}`);
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.warn(`Received request to delete user id=${id}`);
    await this.usersService.remove(id);
  }
}
