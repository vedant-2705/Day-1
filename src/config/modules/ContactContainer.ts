import "reflect-metadata";
import { container } from "tsyringe";
import { ContactRepository } from "repositories/ContactRepository.js";
import { CONTACT_REPOSITORY } from "interfaces/repositories/IContactRepository.js";
import { ContactMapper } from "mapper/ContactMapper.js";
import { CONTACT_MAPPER } from "interfaces/mapper/IContactMapper.js";
import { GET_CONTACTS_USE_CASE, GetContactsUseCase } from "use-cases/contact/GetContactsUseCase.js";
import { GET_CONTACT_BY_ID_USE_CASE, GetContactByIdUseCase } from "use-cases/contact/GetContactByIdUseCase.js";
import { CREATE_CONTACT_USE_CASE, CreateContactUseCase } from "use-cases/contact/CreateContactUseCase.js";
import { UPDATE_CONTACT_USE_CASE, UpdateContactUseCase } from "use-cases/contact/UpdateContactUseCase.js";
import { DELETE_CONTACT_USE_CASE, DeleteContactUseCase } from "use-cases/contact/DeleteContactUseCase.js";
import { GET_CONTACT_HISTORY_USE_CASE, GetContactHistoryUseCase } from "use-cases/contact/GetContactHistoryUseCase.js";
import { ContactControllerV1 } from "controllers/v1/ContactController.js";
import { ContactControllerV2 } from "controllers/v2/ContactController.js";

export function registerContactContainer() {
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
        container.register(GET_CONTACT_HISTORY_USE_CASE, { useClass: GetContactHistoryUseCase });
    
        // --- Controllers (Singleton) ---
        // Singleton: controllers are stateless and wired once at startup
        container.registerSingleton<ContactControllerV1>(ContactControllerV1);
        container.registerSingleton<ContactControllerV2>(ContactControllerV2);
    
} 