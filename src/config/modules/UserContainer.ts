/**
 * @module UserContainer
 * @description Registers user-domain dependencies into the tsyringe IoC container.
 * Covers the user repository and mapper. Use case and controller registrations
 * are reserved here for future expansion.
 */

import "reflect-metadata";
import { container } from "tsyringe";
import { USER_MAPPER } from "interfaces/mapper/IUserMapper.js";
import { USER_REPOSITORY } from "interfaces/repositories/IUserRepository.js";
import { UserMapper } from "mapper/UserMapper.js";
import { UserRepository } from "repositories/UserRepository.js";

export function registerUserContainer() {
    // --- Repositories & Mappers (Singletons) ---
    // Singleton: stateless data-access layer; safe to share across requests
    container.registerSingleton(USER_REPOSITORY, UserRepository);

    // Singleton: pure transformation logic with no mutable state
    container.registerSingleton(USER_MAPPER, UserMapper);
    
    // --- Use Cases (Transient) ---
    // Reserved for future user use cases
    
    // --- Controllers (Singleton) ---
    // Reserved for future user controllers
}