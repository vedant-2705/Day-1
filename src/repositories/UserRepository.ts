/**
 * @module UserRepository
 * @description Concrete Prisma implementation of {@link IUserRepository}.
 *
 * All methods that return user data use the mapper to produce a safe {@link UserDTO},
 * ensuring `passwordHash` is never accidentally leaked. The sole exception is
 * {@link findRawByEmail}, which is reserved exclusively for `LoginUseCase`.
 *
 * Email addresses are normalised to lowercase on every read and write to ensure
 * case-insensitive uniqueness without a case-insensitive database collation.
 */
import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { UserRole } from "generated/prisma/client.js";
import {
    DATABASE_CONNECTION,
    DatabaseConnection,
} from "database/DatabaseConnection.js";
import { IUserRepository } from "interfaces/repositories/IUserRepository.js";
import {
    type IUserMapper,
    USER_MAPPER,
} from "interfaces/mapper/IUserMapper.js";
import { CreateUserDTO, UserDTO } from "dto/UserDTO.js";
import { User } from "domain/entities/User.js";
import { ConflictError } from "shared/errors/ConflictError.js";
import { DbErrorCodes } from "constants/DbErrorCodes.js";
import { ErrorKeys } from "constants/ErrorCodes.js";

@singleton()
export class UserRepository implements IUserRepository {
    constructor(
        @inject(DATABASE_CONNECTION)
        private readonly dbConnection: DatabaseConnection,

        @inject(USER_MAPPER)
        private readonly userMapper: IUserMapper,
    ) {}

    private get prisma() {
        return this.dbConnection.getClient();
    }

    /**
     * {@inheritdoc IUserRepository.findById}
     */
    async findById(id: string): Promise<UserDTO | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        return user ? this.userMapper.toDTO(user) : null;
    }

    /**
     * {@inheritdoc IUserRepository.findByEmail}
     */
    async findByEmail(email: string): Promise<UserDTO | null> {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        return user ? this.userMapper.toDTO(user) : null;
    }

    /**
     * Returns raw Prisma User including passwordHash.
     * Only LoginUseCase should call this - to verify the submitted password.
     * All other callers use findByEmail which returns the safe UserDTO.
     *
     * {@inheritdoc IUserRepository.findRawByEmail}
     */
    async findRawByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
    }

    /**
     * {@inheritdoc IUserRepository.create}
     */
    async create(data: CreateUserDTO): Promise<UserDTO> {
        try {
            const user = await this.prisma.user.create({
                data: {
                    name: data.name,
                    email: data.email.toLowerCase(),
                    passwordHash: data.passwordHash,
                    role: data.role ?? UserRole.USER,
                },
            });
            return this.userMapper.toDTO(user);
        } catch (error: unknown) {
            // Race condition: two simultaneous registrations with same email
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                (error as { code: string }).code === DbErrorCodes.UNIQUE_CONSTRAINT_VIOLATION
            ) {
                throw new ConflictError(ErrorKeys.USER_EMAIL_TAKEN);
            }
            throw error;
        }
    }

    /**
     * {@inheritdoc IUserRepository.existsByEmail}
     */
    async existsByEmail(email: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { email: email.toLowerCase() },
        });
        return count > 0;
    }

    /**
     * Updates the role of a user by ID.
     * Returns the updated UserDTO, or null if the user was not found.
     *
     * {@inheritdoc IUserRepository.updateRole}
     */
    async updateRole(id: string, role: UserRole): Promise<UserDTO | null> {
        try {
            const user = await this.prisma.user.update({
                where: { id },
                data: { role },
            });
            return this.userMapper.toDTO(user);
        } catch (error: unknown) {
            // P2025 = record not found - user with this ID does not exist
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                (error as { code: string }).code === DbErrorCodes.RECORD_NOT_FOUND
            ) {
                return null;
            }
            throw error;
        }
    }
}