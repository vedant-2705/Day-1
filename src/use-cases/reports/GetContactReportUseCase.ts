/**
 * @module GetContactReportUseCase
 * @description Use case that computes and returns aggregated contact statistics
 * for the reports endpoint. Fetches raw counts from the repository and shapes
 * them into the {@link ContactStatsDTO}, including per-domain percentage calculations.
 */

import { inject, injectable } from "tsyringe";
import {
    CONTACT_REPOSITORY,
    type IContactRepository,
} from "interfaces/repositories/IContactRepository.js";
import { LOGGER, Logger } from "logging/Logger.js";

/**
 * Response shape returned by {@link GetContactReportUseCase.execute}.
 *
 * @remarks
 * `generatedAt` is included so clients and caching layers can determine
 * how stale the data is without inspecting response headers.
 */
export interface ContactStatsDTO {
    /** Total number of active (non-deleted) contacts in the system. */
    total: number;

    /** Number of contacts created since midnight UTC today. */
    addedToday: number;

    /** The single most frequently occurring email domain, or `null` if no contacts exist. */
    mostCommonDomain: string | null;

    /**
     * Full per-domain breakdown sorted by count descending.
     * Includes a pre-computed percentage so clients can render charts without extra math.
     */
    domainBreakdown: { domain: string; count: number; percentage: number }[];

    /** ISO 8601 timestamp indicating when this report was computed. */
    generatedAt: string;
}

/**
 * Computes aggregated contact statistics and returns a fully shaped {@link ContactStatsDTO}.
 *
 * @remarks
 * Raw counts are fetched from the repository in a single call (which internally
 * parallelises all three queries). This use case is responsible only for the
 * percentage calculation and DTO shaping - it contains no query logic.
 */
@injectable()
export class GetContactReportUseCase {
    constructor(
        @inject(CONTACT_REPOSITORY)
        private readonly contactRepository: IContactRepository,

        @inject(LOGGER)
        private readonly logger: Logger,
    ) {}

    /**
     * Executes the use case and returns a fully populated {@link ContactStatsDTO}.
     *
     * @returns Contact statistics including totals, today's additions, and domain breakdown.
     */
    async execute(): Promise<ContactStatsDTO> {
        this.logger.info("Computing contact stats");

        const { total, addedToday, domainCounts } =
            await this.contactRepository.getContactStats();

        // Compute percentage share for each domain.
        // Division by zero is guarded for the edge case where total is 0.
        // Percentages are rounded to one decimal place for display.
        const domainBreakdown = domainCounts.map(({ domain, count }) => ({
            domain,
            count,
            percentage:
                total > 0
                    ? Math.round((count / total) * 100 * 10) / 10 // 1 decimal place
                    : 0,
        }));

        // The SQL query already orders domains by count DESC, so the first
        // entry is the most common domain. Falls back to null if no domains exist.
        const mostCommonDomain = domainBreakdown[0]?.domain ?? null;

        return {
            total,
            addedToday,
            mostCommonDomain,
            domainBreakdown,
            generatedAt: new Date().toISOString(),
        };
    }
}

/** DI injection token for {@link GetContactReportUseCase}. */
export const GET_CONTACT_REPORT_USE_CASE = Symbol.for("GetContactReportUseCase");
