import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import type { UserRow } from '../../database/database.types';

export class UserEntity {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false, nullable: true })
  firstName!: string | null;

  @ApiProperty({ required: false, nullable: true })
  lastName!: string | null;

  @Exclude()
  passwordHash!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: UserRow) {
    Object.assign(this, partial);
  }
}
