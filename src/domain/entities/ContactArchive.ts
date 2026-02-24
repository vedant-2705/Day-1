import { Contact } from "./Contact.js";

export interface ContactArchive extends Contact {
    deletedAt: Date; // Timestamp when the contact was archived
    archivedAt: Date; // Timestamp when the contact was moved to archive
}