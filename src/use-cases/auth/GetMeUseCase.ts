/**
 * @module GetMeUseCase
 * @description Use case that retrieves the authenticated user's own profile.
 *
 * The `userId` is always sourced from the verified JWT payload attached by
 * `authMiddleware` - it is never read from the request body, preventing a user
 * from fetching another user's profile by supplying a different ID.
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { type IUserRepository, USER_REPOSITORY } from "interfaces/repositories/IUserRepository.js";
import { UserDTO } from "dto/UserDTO.js";
import { NotFoundError } from "shared/errors/NotFoundError.js";
import { ErrorKeys } from "constants/ErrorCodes.js";

@injectable()
export class GetMeUseCase {
    constructor(
        @inject(USER_REPOSITORY)
        private readonly userRepo: IUserRepository,
    ) {}

    /**
     * Returns the profile of the currently authenticated user.
     *
     * @param userId - ID extracted from the verified JWT; never from the request body.
     * @returns The matching {@link UserDTO} (no `passwordHash`).
     * @throws {NotFoundError} If the user no longer exists (e.g. account deleted after token was issued).
     */
    async execute(userId: string): Promise<UserDTO> {
        const user = await this.userRepo.findById(userId);

        if (!user) {
            throw new NotFoundError(ErrorKeys.USER_NOT_FOUND);
        }

        return user;
    }
}

export const GET_ME_USE_CASE = Symbol.for("GetMeUseCase");