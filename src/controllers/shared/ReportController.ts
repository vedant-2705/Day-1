import "reflect-metadata";
import { inject, singleton } from "tsyringe";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "helpers/ResponseHelper.js";
import { GET_CONTACT_REPORT_USE_CASE, GetContactReportUseCase } from "use-cases/reports/GetContactReportUseCase.js";

@singleton()
export class ReportController {
    constructor(
        @inject(GET_CONTACT_REPORT_USE_CASE)
        private readonly getContactReportUseCase: GetContactReportUseCase,
    ) {}

    /**
     * GET /reports/contacts-stats
     *
     * Returns aggregated contact statistics.
     * @responds 200
     */
    getContactReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        // Cache miss — compute fresh result
        const stats = await this.getContactReportUseCase.execute();
        res.status(StatusCodes.OK).json(successResponse(stats));
    };
}
