import "reflect-metadata";
import { container } from "tsyringe";
import { CONTACT_MAPPER } from "@application/interfaces/mapper/IContactMapper.js";
import { CONTACT_REPOSITORY } from "@application/interfaces/repositories/IContactRepository.js";
import { ContactMapper } from "@application/mapper/ContactMapper.js";
import { CREATE_CONTACT_USE_CASE, CreateContactUseCase } from "@application/use-cases/contact/CreateContactUseCase.js";
import { DELETE_CONTACT_USE_CASE, DeleteContactUseCase } from "@application/use-cases/contact/DeleteContactUseCase.js";
import { GET_CONTACT_BY_ID_USE_CASE, GetContactByIdUseCase } from "@application/use-cases/contact/GetContactByIdUseCase.js";
import { GET_CONTACTS_USE_CASE, GetContactsUseCase } from "@application/use-cases/contact/GetContactsUseCase.js";
import { UPDATE_CONTACT_USE_CASE, UpdateContactUseCase } from "@application/use-cases/contact/UpdateContactUseCase.js";
import { ContactRepository } from "@infrastructure/database/repositories/ContactRepository.js";
import { ContactController } from "@presentation/controllers/ContactController.js";
import { LOGGER, Logger } from "@infrastructure/logging/Logger.js";
import { DATABASE_CONNECTION, DatabaseConnection } from "@infrastructure/database/DatabaseConnection.js";



export function registerDependencies() {
    // Infrastructure - Singletons
    container.registerSingleton<Logger>(LOGGER, Logger);
    container.registerSingleton<DatabaseConnection>(
        DATABASE_CONNECTION,
        DatabaseConnection,
    );

    container.registerSingleton(CONTACT_REPOSITORY, ContactRepository);

    container.registerSingleton(CONTACT_MAPPER, ContactMapper);

    // Use cases
    container.register(GET_CONTACTS_USE_CASE, { useClass: GetContactsUseCase });
    container.register(GET_CONTACT_BY_ID_USE_CASE, { useClass: GetContactByIdUseCase });
    container.register(CREATE_CONTACT_USE_CASE, { useClass: CreateContactUseCase });
    container.register(UPDATE_CONTACT_USE_CASE, { useClass: UpdateContactUseCase });
    container.register(DELETE_CONTACT_USE_CASE, { useClass: DeleteContactUseCase });
    

    container.registerSingleton<ContactController>(ContactController);
}
