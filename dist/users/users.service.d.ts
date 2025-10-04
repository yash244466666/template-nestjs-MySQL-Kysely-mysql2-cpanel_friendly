import { DatabaseService } from '../database/database.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
export declare class UsersService {
    private readonly database;
    private readonly logger;
    constructor(database: DatabaseService);
    private get db();
    create(dto: CreateUserDto): Promise<UserEntity>;
    findAll(query: PaginationQueryDto): Promise<UserEntity[]>;
    findOne(id: number): Promise<UserEntity>;
    update(id: number, dto: UpdateUserDto): Promise<UserEntity>;
    remove(id: number): Promise<void>;
    private findUserById;
    private toError;
    private isDuplicateEntryError;
}
