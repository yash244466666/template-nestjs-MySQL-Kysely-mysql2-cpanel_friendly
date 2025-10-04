import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface UserTable {
  id: Generated<number>;
  email: string;
  firstName: string | null;
  lastName: string | null;
  passwordHash: string;
  createdAt: ColumnType<Date, Date | undefined, Date>;
  updatedAt: ColumnType<Date, Date | undefined, Date>;
}

export interface Database {
  User: UserTable;
}

export type UserRow = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;
