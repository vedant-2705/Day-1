import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { ContactControllerV1 } from "controllers/v1/ContactController.js";
import { successResponse } from "helpers/ResponseHelper.js";

@singleton()
export class ContactControllerV2 extends ContactControllerV1 {

    override getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        res.json(
            successResponse({ version: 'v2', message: 'Pagination coming next' })
        )
    }
}