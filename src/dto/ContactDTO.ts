export interface CreateContactDTO {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export type UpdateContactDTO = Partial<CreateContactDTO>;

export interface ContactDTO {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
}
