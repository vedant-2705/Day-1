import { ErrorKeys } from "constants/ErrorCodes.js";
import { ContactDTO } from "dto/ContactDTO.js";
import { UserRole } from "generated/prisma/enums.js";
import { CONTACT_REPOSITORY, type IContactRepository } from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { AuthUser } from "middlewares/AuthMiddleware.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { inject, injectable } from "tsyringe";

/**
 * Use case: Retrieve a single contact by its unique ID.
 *
 * Throws {@link NotFoundError} (404) if no contact with the given ID exists.
 */
@injectable()
export class GetContactByIdUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * @param id - UUID of the contact to retrieve
     * @returns The matching contact as a DTO
     * @throws {NotFoundError} If no contact with the given ID exists
     */
    async execute(id: string, authUser: AuthUser): Promise<ContactDTO> {
        const contact = await this.contactRepository.findById(id);

        if (!contact) {
            this.logger.warn(`Contact with ID ${id} not found`);
            throw new NotFoundError(ErrorKeys.CONTACT_NOT_FOUND, { id });
        }

        if(
            authUser.role === UserRole.USER &&
            contact.createdBy !== authUser.userId
        ) {
            this.logger.warn(`User ${authUser.userId} attempted to access contact ${id} owned by ${contact.createdBy}`);
            throw new NotFoundError(ErrorKeys.CONTACT_NOT_FOUND, { id });
        }

        this.logger.info(`Retrieved contact with ID ${id}`);

        return contact;
    }
}

/** DI injection token for {@link GetContactByIdUseCase}. */
export const GET_CONTACT_BY_ID_USE_CASE = Symbol.for("GetContactByIdUseCase");