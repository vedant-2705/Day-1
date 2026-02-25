import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { ContactControllerV1 } from "controllers/v1/ContactController.js";
import { successResponse } from "helpers/ResponseHelper.js";
import { GET_CONTACT_BY_ID_USE_CASE, GetContactByIdUseCase } from "use-cases/contact/GetContactByIdUseCase.js";
import { CREATE_CONTACT_USE_CASE, CreateContactUseCase } from "use-cases/contact/CreateContactUseCase.js";
import { GET_CONTACTS_USE_CASE, GetContactsUseCase } from "use-cases/contact/GetContactsUseCase.js";
import { UPDATE_CONTACT_USE_CASE, UpdateContactUseCase } from "use-cases/contact/UpdateContactUseCase.js";
import { DELETE_CONTACT_USE_CASE, DeleteContactUseCase } from "use-cases/contact/DeleteContactUseCase.js";

@singleton()
export class ContactControllerV2 extends ContactControllerV1 {

    constructor(
        @inject(GET_CONTACTS_USE_CASE)
        protected readonly getContactsUseCase: GetContactsUseCase,

        @inject(GET_CONTACT_BY_ID_USE_CASE)
        protected readonly getContactByIdUseCase: GetContactByIdUseCase,

        @inject(CREATE_CONTACT_USE_CASE)
        protected readonly createContactUseCase: CreateContactUseCase,

        @inject(UPDATE_CONTACT_USE_CASE)
        protected readonly updateContactUseCase: UpdateContactUseCase,
        
        @inject(DELETE_CONTACT_USE_CASE)
        protected readonly deleteContactUseCase: DeleteContactUseCase,
            
    ) {
        super(
            getContactsUseCase,
            getContactByIdUseCase,
            createContactUseCase,
            updateContactUseCase,
            deleteContactUseCase,
        )
    }
    override getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        res.json(
            successResponse({ version: 'v2', message: 'Pagination coming next' })
        )
    }
}