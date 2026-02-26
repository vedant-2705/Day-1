import { User } from "domain/entities/User.js";
import { UserDTO } from "dto/UserDTO.js";

export interface IUserMapper {
    toDTO(user: User): UserDTO;
    toDTOs(users: User[]): UserDTO[];
}

export const USER_MAPPER = Symbol.for("IUserMapper");