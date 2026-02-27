/**
 * @module IUserMapper
 * @description Defines the contract for mapping between the raw {@link User} domain entity
 * and the safe {@link UserDTO} used in API responses.
 *
 * Keeping the mapper behind an interface allows the concrete implementation to be
 * swapped or mocked independently in tests.
 */
import { User } from "domain/entities/User.js";
import { UserDTO } from "dto/UserDTO.js";

export interface IUserMapper {
    /**
     * Maps a single raw {@link User} domain entity to a {@link UserDTO}.
     * Strips sensitive fields (e.g. `passwordHash`) from the output.
     *
     * @param user The raw user entity returned from the repository.
     * @returns A safe, serialisable DTO suitable for API responses.
     */
    toDTO(user: User): UserDTO;

    /**
     * Maps an array of raw {@link User} entities to an array of {@link UserDTO}s.
     * Convenience wrapper around {@link toDTO} for bulk operations.
     *
     * @param users An array of raw user entities.
     * @returns An array of safe DTOs.
     */
    toDTOs(users: User[]): UserDTO[];
}

/** DI token used to resolve {@link IUserMapper} from the tsyringe container. */
export const USER_MAPPER = Symbol.for("IUserMapper");