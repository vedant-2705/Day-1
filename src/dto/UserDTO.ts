import { UserRole } from "generated/prisma/enums.js";


export interface CreateUserDTO {
    name: string;
    email: string;
    passwordHash: string;
    role?: UserRole; 
}

export interface UserDTO {
    id: string;
    name: string;
    email: string;
    role: UserRole; 
    createdAt: Date;
    updatedAt: Date;
}
