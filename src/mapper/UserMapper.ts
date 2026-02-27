/**
 * @module UserMapper
 * @description Concrete implementation of {@link IUserMapper}.
 * Transforms raw {@link User} domain entities into safe {@link UserDTO}s
 * by projecting only the fields appropriate for external consumption
 * (i.e. excluding `passwordHash`).
 */

import { injectable } from "tsyringe";
import { UserDTO } from "dto/UserDTO.js";
import { IUserMapper } from "interfaces/mapper/IUserMapper.js";
import { User } from "domain/entities/User.js";

@injectable()
export class UserMapper implements IUserMapper {
    /**
     * Maps a single {@link User} entity to a {@link UserDTO}.
     * Strips `passwordHash` - the returned object is safe to include in API responses.
     *
     * @param user The raw user entity from the repository.
     * @returns A serialisable DTO without sensitive fields.
     */
    toDTO(user: User): UserDTO {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    /**
     * Maps an array of {@link User} entities to an array of {@link UserDTO}s.
     * Convenience wrapper around {@link toDTO} for bulk operations.
     *
     * @param users Array of raw user entities.
     * @returns Array of safe DTOs.
     */
    toDTOs(users: User[]): UserDTO[] {
        return users.map(this.toDTO);
    }
}
