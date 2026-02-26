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
     * Returns the current authenticated user's profile.
     * userId is extracted from the verified JWT — never from the request body.
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