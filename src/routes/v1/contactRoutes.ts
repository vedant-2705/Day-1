/**
 * @module contactRoutes
 * @description Express router for the /contacts resource.
 *
 * Route table:
 *   GET    /contacts        - Retrieve all contacts
 *   POST   /contacts        - Create a new contact        [validates body]
 *   GET    /contacts/:id    - Retrieve a contact by ID    [validates params]
 *   PATCH  /contacts/:id    - Update a contact by ID      [validates params + body]
 *   DELETE /contacts/:id    - Delete a contact by ID      [validates params]
 */

import { Router } from "express";
import { validate } from "middlewares/ValidationMiddleware.js";
import {
    createContactSchema,
    updateContactSchema,
    uuidSchema,
} from "validators/contactValidator.js";
import { asyncHandler } from "middlewares/AsyncHandler.js";
import { resolveController } from "helpers/ControllerResolver.js";
import { ContactControllerV1 } from "controllers/v1/ContactController.js";

const router = Router();

const controller = resolveController(ContactControllerV1);

/**
 * @swagger
 * /v1/contacts:
 *   get:
 *     summary: List all contacts
 *     description: Returns all non-deleted contacts. USERs only see contacts they created; ADMINs see all.
 *     tags: [Contacts v1]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of contacts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "clxyz789"
 *                   name: "John Smith"
 *                   email: "john@example.com"
 *                   phone: "9876543210"
 *                   address: "123 Main St"
 *                   createdBy: "clxyz123"
 *                   createdAt: "2024-01-15T10:00:00.000Z"
 *                   updatedAt: "2024-01-15T10:00:00.000Z"
 *               meta:
 *                 timestamp: "2024-01-15T10:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Create a new contact
 *     description: Creates a contact owned by the authenticated user.
 *     tags: [Contacts v1]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContactRequest'
 *     responses:
 *       201:
 *         description: Contact created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: "clxyz789"
 *                 name: "John Smith"
 *                 email: "john@example.com"
 *                 phone: "9876543210"
 *                 address: "123 Main St"
 *       409:
 *         description: Contact with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: "CONTACT_EMAIL_CONFLICT"
 *               detail: "A contact with email 'john@example.com' already exists"
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route("/")
    .get(asyncHandler((req, res, next) => controller().getAll(req, res, next)))
    .post(
        validate(createContactSchema),
        asyncHandler((req, res, next) => controller().create(req, res, next)),
    );

/**
 * @swagger
 * /v1/contacts/{id}:
 *   get:
 *     summary: Get a contact by ID
 *     description: USERs can only fetch their own contacts. ADMINs can fetch any.
 *     tags: [Contacts v1]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact CUID
 *         example: "clxyz789"
 *     responses:
 *       200:
 *         description: Contact found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   patch:
 *     summary: Update a contact by ID
 *     description: Partial update - only include fields you want to change. USERs can only update their own contacts.
 *     tags: [Contacts v1]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxyz789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateContactRequest'
 *     responses:
 *       200:
 *         description: Contact updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     summary: Soft-delete a contact by ID
 *     description: Marks the contact as deleted (soft delete). The record is retained in the database for audit purposes. USERs can only delete their own contacts.
 *     tags: [Contacts v1]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxyz789"
 *     responses:
 *       200:
 *         description: Contact deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data: null
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route("/:id")
    .get(
        validate(uuidSchema, "params"),
        asyncHandler((req, res, next) => controller().getById(req, res, next)),
    )
    .patch(
        validate(uuidSchema, "params"),
        validate(updateContactSchema),
        asyncHandler((req, res, next) => controller().update(req, res, next)),
    )
    .delete(
        validate(uuidSchema, "params"),
        asyncHandler((req, res, next) => controller().delete(req, res, next)),
    );

export { router as contactRoutesV1 };