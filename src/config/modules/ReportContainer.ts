import { ReportController } from "controllers/shared/ReportController.js";
import "reflect-metadata";
import { container } from "tsyringe";
import { GET_CONTACT_REPORT_USE_CASE, GetContactReportUseCase } from "use-cases/reports/GetContactReportUseCase.js";

export function registerReportContainer() {
    // --- Use Cases (Transient) ---
    container.register(GET_CONTACT_REPORT_USE_CASE, { useClass: GetContactReportUseCase });
    
    // --- Controllers (Singleton) ---
    // Singleton: controllers are stateless and wired once at startup
    container.registerSingleton<ReportController>(ReportController);
    
}