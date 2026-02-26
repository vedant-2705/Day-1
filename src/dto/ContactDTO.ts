/**
 * @module ContactDTO
 * @description Data Transfer Objects for the Contact resource.
 * These types cross layer boundaries (use cases -> controller -> client)
 * and intentionally exclude internal domain fields not meant for public exposure.
 */

/** Payload required to create a new contact. All fields are mandatory. */
export interface CreateContactDTO {
    name: string;
    email: string;
    phone: string;
    address: string;
}

/** Payload for updating a contact. All fields are optional; at least one must be provided. */
export type UpdateContactDTO = Partial<CreateContactDTO>;

/** Full contact representation returned to callers. Excludes internal fields like `version`. */
export interface ContactDTO {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;

    createdBy: string | null; // Expose creator's user ID for auditing purposes
}
