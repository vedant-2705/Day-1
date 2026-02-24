/**
 * @module ContactController
 * @description HTTP layer for the Contacts resource. Delegates all business logic
 * to injected use cases and returns standardized JSON responses.
 * Wraps async handlers - errors propagate to the global error middleware via `next`.
 */

import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "helpers/ResponseHelper.js";
import { CreateContactDTO } from "validators/contactValidator.js";
import { GET_CONTACTS_USE_CASE, GetContactsUseCase } from "use-cases/contact/GetContactsUseCase.js";
import { GET_CONTACT_BY_ID_USE_CASE, GetContactByIdUseCase } from "use-cases/contact/GetContactByIdUseCase.js";
import { CREATE_CONTACT_USE_CASE, CreateContactUseCase } from "use-cases/contact/CreateContactUseCase.js";
import { UPDATE_CONTACT_USE_CASE, UpdateContactUseCase } from "use-cases/contact/UpdateContactUseCase.js";
import { DELETE_CONTACT_USE_CASE, DeleteContactUseCase } from "use-cases/contact/DeleteContactUseCase.js";
import { StatusCodes } from "http-status-codes";


/**
 * Handles all HTTP requests for the /contacts resource.
 *
 * @remarks
 * Registered as a singleton - all injected use cases are resolved fresh (transient)
 * per resolution, so no shared mutable state is introduced.
 */
@singleton()
export class ContactControllerV1 {
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
    ) {}

    /** GET /contacts - returns all contacts. 
     * @responds 200
     */
    getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        const results = await this.getContactsUseCase.execute();

        res.status(StatusCodes.OK).json(
            successResponse(results),
        );
    };

    /** GET /contacts/:id - returns a contact by ID. 
     * @responds 200 | 404 
     */
    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        const { id } = req.params;

        const contact = await this.getContactByIdUseCase.execute(id as string);

        res.status(StatusCodes.OK).json(
            successResponse(contact),
        );
    };

    /** POST /contacts - creates a new contact.
     * @responds 201 | 409 
     */
    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        const data: CreateContactDTO = req.body;

        const newContact = await this.createContactUseCase.execute(data);

        res.status(StatusCodes.CREATED).json(
            successResponse(newContact),
        );
    };

    /** PATCH /contacts/:id - updates an existing contact. 
     * @responds 200 | 404 | 409 
     */
    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;

        const updatedContact = await this.updateContactUseCase.execute(id as string, req.body);

        res.status(StatusCodes.OK).json(
            successResponse(updatedContact),
        );
    };

    /** DELETE /contacts/:id - removes a contact. 
     * @responds 200 | 404 
     */
    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;

        await this.deleteContactUseCase.execute(id as string);
        res.status(StatusCodes.OK).json(
            successResponse({ message: "Contact deleted successfully" }),
        );
    };
}
