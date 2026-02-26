import { User } from "domain/entities/User.js";
import { CreateUserDTO, UserDTO } from "dto/UserDTO.js";
    

export interface IUserRepository {
    // Returns UserDTO - safe for general use, no passwordHash
    findById(id: string): Promise<UserDTO | null>;
    findByEmail(email: string): Promise<UserDTO | null>;
    create(data: CreateUserDTO): Promise<UserDTO>;
    existsByEmail(email: string): Promise<boolean>;

    // Returns raw Prisma User INCLUDING passwordHash
    // Only used by LoginUseCase to verify the password
    findRawByEmail(email: string): Promise<User | null>;
}

export const USER_REPOSITORY = Symbol.for("IUserRepository"); 
