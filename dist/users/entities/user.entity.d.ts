import type { UserRow } from '../../database/database.types';
export declare class UserEntity {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
    constructor(partial: UserRow);
}
