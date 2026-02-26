import "reflect-metadata";
import { container } from "tsyringe";
import { USER_MAPPER } from "interfaces/mapper/IUserMapper.js";
import { USER_REPOSITORY } from "interfaces/repositories/IUserRepository.js";
import { UserMapper } from "mapper/UserMapper.js";
import { UserRepository } from "repositories/UserRepository.js";

export function registerUserContainer() {
    // --- Repositories & Mappers (Singletons) ---
    container.registerSingleton(USER_REPOSITORY, UserRepository);
    container.registerSingleton(USER_MAPPER, UserMapper);
    
    // --- Use Cases (Transient) ---
    
    // --- Controllers (Singleton) ---
}