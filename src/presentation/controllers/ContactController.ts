import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "@presentation/helpers/ResponseHelper.js";
import { CreateContactDTO } from "@presentation/validators/contactValidator.js";
import { GET_CONTACTS_USE_CASE, GetContactsUseCase } from "@application/use-cases/contact/GetContactsUseCase.js";
import { GET_CONTACT_BY_ID_USE_CASE, GetContactByIdUseCase } from "@application/use-cases/contact/GetContactByIdUseCase.js";
import { CREATE_CONTACT_USE_CASE, CreateContactUseCase } from "@application/use-cases/contact/CreateContactUseCase.js";
import { UPDATE_CONTACT_USE_CASE, UpdateContactUseCase } from "@application/use-cases/contact/UpdateContactUseCase.js";
import { DELETE_CONTACT_USE_CASE, DeleteContactUseCase } from "@application/use-cases/contact/DeleteContactUseCase.js";


@singleton()
export class ContactController {
    constructor(
        @inject(GET_CONTACTS_USE_CASE)
        private readonly getContactsUseCase: GetContactsUseCase,

        @inject(GET_CONTACT_BY_ID_USE_CASE)
        private readonly getContactByIdUseCase: GetContactByIdUseCase,

        @inject(CREATE_CONTACT_USE_CASE)
        private readonly createContactUseCase: CreateContactUseCase,

        @inject(UPDATE_CONTACT_USE_CASE)
        private readonly updateContactUseCase: UpdateContactUseCase,
        
        @inject(DELETE_CONTACT_USE_CASE)
        private readonly deleteContactUseCase: DeleteContactUseCase,
    ) {}

    getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        const results = await this.getContactsUseCase.execute();

        res.status(200).json(
            successResponse(results),
        );
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        const { id } = req.params;

        const contact = await this.getContactByIdUseCase.execute(id as string);

        res.status(200).json(
            successResponse(contact),
        );
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        const data: CreateContactDTO = req.body;

        const newContact = await this.createContactUseCase.execute(data);

        res.status(201).json(
            successResponse(newContact),
        );
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;

        const updatedContact = await this.updateContactUseCase.execute(id as string, req.body);

        res.status(200).json(
            successResponse(updatedContact),
        );
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;

        await this.deleteContactUseCase.execute(id as string);
        res.status(200).json(
            successResponse({ message: "Contact deleted successfully" }),
        );
    };
}
