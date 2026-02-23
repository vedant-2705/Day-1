import { CONTACT_REPOSITORY, type IContactRepository } from "@application/interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "@infrastructure/logging/Logger.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { inject, injectable } from "tsyringe";

@injectable()
export class DeleteContactUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    async execute(id: string): Promise<void> {
        const deleted = await this.contactRepository.delete(id);

        if (!deleted) {
            this.logger.warn(`Contact with ID ${id} not found for deletion`);
            throw new NotFoundError(`Contact with ID '${id}' not found`);
        }
        this.logger.info(`Contact deleted with ID: ${id}`);
    }
}

export const DELETE_CONTACT_USE_CASE = Symbol.for("DeleteContactUseCase");