/**
 * @module PromoteUserUseCase
 * @description Use case that promotes a USER to ADMIN role.
 * Only an existing ADMIN can trigger this - enforced at the route level
 * via requireRole(UserRole.ADMIN).
 *
 * Business rules:
 * - Target user must exist             -> 404 if not found
 * - Target user must currently be USER -> 409 if already ADMIN
 * - Caller cannot be the same as the target (no self-promotion guard needed
 *   since they're already ADMIN to reach this endpoint)
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { UserRole } from "generated/prisma/enums.js";
import {
    type IUserRepository,
    USER_REPOSITORY,
} from "interfaces/repositories/IUserRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { ConflictError } from "shared/errors/ConflictError.js";
import { UserDTO } from "dto/UserDTO.js";
import { ErrorKeys } from "constants/ErrorCodes.js";

@injectable()
export class PromoteUserUseCase {
    constructor(
        @inject(USER_REPOSITORY)
        private readonly userRepo: IUserRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * Promotes a USER to ADMIN.
     *
     * @param targetUserId - ID of the user to promote
     * @returns The updated UserDTO with role ADMIN
     * @throws {NotFoundError}  If no user with the given ID exists
     * @throws {ConflictError}  If the user is already an ADMIN
     */
    async execute(targetUserId: string): Promise<UserDTO> {
        this.logger.info(`Attempting to promote user ${targetUserId} to ADMIN`);

        const user = await this.userRepo.findById(targetUserId);

        if (!user) {
            this.logger.warn(`Promote failed: user ${targetUserId} not found`);
            throw new NotFoundError(ErrorKeys.USER_NOT_FOUND, {
                id: targetUserId,
            });
        }

        // already an admin - idempotent promotion would be confusing
        // Return 409 so the caller knows no change was made
        if (user.role === UserRole.ADMIN) {
            this.logger.warn(
                `Promote failed: user ${targetUserId} is already ADMIN`,
            );
            throw new ConflictError(ErrorKeys.CONFLICT, {});
        }

        const updated = await this.userRepo.updateRole(
            targetUserId,
            UserRole.ADMIN,
        );

        // Should not happen - existence was confirmed above - but guards against race condition
        if (!updated) {
            throw new NotFoundError(ErrorKeys.USER_NOT_FOUND, {
                id: targetUserId,
            });
        }

        this.logger.info(`User ${targetUserId} successfully promoted to ADMIN`);

        return updated;
    }
}

export const PROMOTE_USER_USE_CASE = Symbol.for("PromoteUserUseCase");
