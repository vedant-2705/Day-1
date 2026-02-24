/**
 * @module container
 * @description Configures the application's IoC container (tsyringe).
 * All dependency bindings are centralized here to enforce separation of concerns
 * and enable testability via injection.
 */

import "reflect-metadata";
import { container } from "tsyringe";
import { CONTACT_MAPPER } from "interfaces/mapper/IContactMapper.js";
import { CONTACT_REPOSITORY } from "interfaces/repositories/IContactRepository.js";
import { ContactMapper } from "mapper/ContactMapper.js";
import { CREATE_CONTACT_USE_CASE, CreateContactUseCase } from "use-cases/contact/CreateContactUseCase.js";
import { DELETE_CONTACT_USE_CASE, DeleteContactUseCase } from "use-cases/contact/DeleteContactUseCase.js";
import { GET_CONTACT_BY_ID_USE_CASE, GetContactByIdUseCase } from "use-cases/contact/GetContactByIdUseCase.js";
import { GET_CONTACTS_USE_CASE, GetContactsUseCase } from "use-cases/contact/GetContactsUseCase.js";
import { UPDATE_CONTACT_USE_CASE, UpdateContactUseCase } from "use-cases/contact/UpdateContactUseCase.js";
import { ContactRepository } from "repositories/ContactRepository.js";
import { ContactControllerV1 } from "controllers/v1/ContactController.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { DATABASE_CONNECTION, DatabaseConnection } from "database/DatabaseConnection.js";

/**
 * Registers all application dependencies into the tsyringe DI container.
 * Must be called once at application startup, before any container.resolve() calls.
 *
 * Lifecycle conventions used here:
 * - `registerSingleton`: infrastructure and stateful services (DB, logger, repositories, mappers)
 * - `register` (transient): use cases - stateless per-request logic
 */
export function registerDependencies() {
    // --- Infrastructure (Singletons) ---
    // Singleton: shared logger instance to avoid duplicate transports across the app
    container.registerSingleton<Logger>(LOGGER, Logger);

    // Singleton: manages PrismaClient lifecycle; avoids multiple DB connection pools
    container.registerSingleton<DatabaseConnection>(
        DATABASE_CONNECTION,
        DatabaseConnection,
    );

    // --- Repositories & Mappers (Singletons) ---
    // Singleton: stateless data-access layer; safe to share across requests
    container.registerSingleton(CONTACT_REPOSITORY, ContactRepository);

    // Singleton: pure transformation logic with no mutable state
    container.registerSingleton(CONTACT_MAPPER, ContactMapper);

    // --- Use Cases (Transient) ---
    // Transient: each resolution gets a fresh instance to avoid shared state between requests
    container.register(GET_CONTACTS_USE_CASE, { useClass: GetContactsUseCase });
    container.register(GET_CONTACT_BY_ID_USE_CASE, { useClass: GetContactByIdUseCase });
    container.register(CREATE_CONTACT_USE_CASE, { useClass: CreateContactUseCase });
    container.register(UPDATE_CONTACT_USE_CASE, { useClass: UpdateContactUseCase });
    container.register(DELETE_CONTACT_USE_CASE, { useClass: DeleteContactUseCase });

    // --- Controllers (Singleton) ---
    // Singleton: controllers are stateless and wired once at startup
    container.registerSingleton<ContactControllerV1>(ContactControllerV1);
    // container.registerSingleton<ContactControllerV2>(ContactControllerV2);
}
