// src/mappers/UserMapper.ts

import { injectable } from "tsyringe";
import { UserDTO } from "dto/UserDTO.js";
import { IUserMapper } from "interfaces/mapper/IUserMapper.js";
import { User } from "domain/entities/User.js";

@injectable()
export class UserMapper implements IUserMapper {
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

    toDTOs(users: User[]): UserDTO[] {
        return users.map(this.toDTO);
    }
}
