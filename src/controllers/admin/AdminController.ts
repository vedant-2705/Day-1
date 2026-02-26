/**
 * @module AdminController
 * @description HTTP layer for admin-only operations.
 * All routes that reach this controller are already gated behind
 * authMiddleware + requireRole(ADMIN) at the router level.
 */

import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "helpers/ResponseHelper.js";
import {
    PROMOTE_USER_USE_CASE,
    PromoteUserUseCase,
} from "use-cases/admin/PromoteUserUseCase.js";

@singleton()
export class AdminController {
    constructor(
        @inject(PROMOTE_USER_USE_CASE)
        private readonly promoteUserUseCase: PromoteUserUseCase,
    ) {}

    /**
     * POST /admin/users/:id/promote
     * Promotes a USER to ADMIN role.
     * @responds 200 - User promoted successfully
     * @responds 404 - User not found
     * @responds 409 - User is already an ADMIN
     */
    promoteUser = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { id } = req.params;

        const updatedUser = await this.promoteUserUseCase.execute(id as string);

        res.status(StatusCodes.OK).json(successResponse({ user: updatedUser }));
    };
}
