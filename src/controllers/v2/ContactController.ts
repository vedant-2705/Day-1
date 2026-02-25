import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { ContactControllerV1 } from "controllers/v1/ContactController.js";
import { successResponse } from "helpers/ResponseHelper.js";
import {
    GET_CONTACT_BY_ID_USE_CASE,
    GetContactByIdUseCase,
} from "use-cases/contact/GetContactByIdUseCase.js";
import {
    CREATE_CONTACT_USE_CASE,
    CreateContactUseCase,
} from "use-cases/contact/CreateContactUseCase.js";
import {
    GET_CONTACTS_USE_CASE,
    GetContactsUseCase,
} from "use-cases/contact/GetContactsUseCase.js";
import {
    UPDATE_CONTACT_USE_CASE,
    UpdateContactUseCase,
} from "use-cases/contact/UpdateContactUseCase.js";
import {
    DELETE_CONTACT_USE_CASE,
    DeleteContactUseCase,
} from "use-cases/contact/DeleteContactUseCase.js";
import { StatusCodes } from "http-status-codes";
import { contactQuerySchema } from "validators/paginationValidator.js";
import { SortBuilder } from "lib/pagination/SortBuilder.js";
import { GET_CONTACT_HISTORY_USE_CASE, GetContactHistoryUseCase } from "use-cases/contact/GetContactHistoryUseCase.js";

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

        @inject(GET_CONTACT_HISTORY_USE_CASE)
        protected readonly getContactHistoryUseCase: GetContactHistoryUseCase,
    ) {
        super(
            getContactsUseCase,
            getContactByIdUseCase,
            createContactUseCase,
            updateContactUseCase,
            deleteContactUseCase,
        );
    }

    /**
     * GET /api/v2/contacts
     *
     * Supports:
     *   ?paginationType=cursor (default) | offset
     *   ?search=john                   - fuzzy across name + email
     *   ?name=john                     - filter by name substring
     *   ?email=gmail                   - filter by email substring
     *   ?sort=name:asc,createdAt:desc  - multi-field sort
     *
     * Cursor mode:
     *   ?limit=10&cursor=<token>&direction=forward|backward
     *
     * Offset mode:
     *   ?limit=10&page=2
     */
    override getAll = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const parsed = contactQuerySchema.safeParse(req.query);

        if (!parsed.success) {
            return next(parsed.error);
        }

        const { paginationType, sort: sortParam, ...rest } = parsed.data;

        const sort = SortBuilder.parse(sortParam);

        const queryParams = { ...rest, sort };

        if (paginationType === "offset") {
            const result =
                await this.getContactsUseCase.executeWithOffset(queryParams);
            res.status(StatusCodes.OK).json(
                successResponse(result.data, {
                    pagination: result.pagination,
                }),
            );
        } else {
            const result =
                await this.getContactsUseCase.executeWithCursor(queryParams);
            res.status(StatusCodes.OK).json(
                successResponse(result.data, {
                    pagination: result.pagination,
                }),
            );
        }
    };

    /**
     * GET /contacts/:id/history
     * Returns the full audit trail for a contact.
     * @responds 200 | 404
     */
    getHistory = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { id } = req.params;
        const history = await this.getContactHistoryUseCase.execute(id as string);
        res.status(StatusCodes.OK).json(successResponse(history));
    };
}
