import { User } from "domain/entities/User.js";
import { CreateUserDTO, UserDTO } from "dto/UserDTO.js";
import { UserRole } from "generated/prisma/enums.js";
    

export interface IUserRepository {
    // Returns UserDTO - safe for general use, no passwordHash
    findById(id: string): Promise<UserDTO | null>;
    findByEmail(email: string): Promise<UserDTO | null>;
    create(data: CreateUserDTO): Promise<UserDTO>;
    existsByEmail(email: string): Promise<boolean>;

    // Returns raw Prisma User INCLUDING passwordHash
    // Only used by LoginUseCase to verify the password
    findRawByEmail(email: string): Promise<User | null>;

    /**
     * Promotes a USER to ADMIN role.
     * Returns the updated UserDTO, or null if the user was not found.
     */
    updateRole(id: string, role: UserRole): Promise<UserDTO | null>;
    
}

export const USER_REPOSITORY = Symbol.for("IUserRepository"); 
