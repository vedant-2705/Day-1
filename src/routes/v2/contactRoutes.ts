/**
 * @module contactRoutes
 * @description Express router for the /contacts resource.
 *
 * Route table:
 *   GET    /contacts           - Retrieve all contacts (cursor/offset pagination, search, sort, filter)
 *   POST   /contacts           - Create a new contact        [validates body]
 *   GET    /contacts/:id       - Retrieve a contact by ID    [validates params]
 *   PATCH  /contacts/:id       - Update a contact by ID      [validates params + body]
 *   DELETE /contacts/:id       - Delete a contact by ID      [validates params]
 *   GET    /contacts/:id/history - Get audit history         [ADMIN only]
 */

import { Router } from "express";
import { validate } from "middlewares/ValidationMiddleware.js";
import {
    createContactSchema,
    updateContactSchema,
    uuidSchema,
} from "validators/contactValidator.js";
import { asyncHandler } from "middlewares/AsyncHandler.js";
// import { apiRateLimit } from "middlewares/RateLimitMiddleware.js";
import { resolveController } from "helpers/ControllerResolver.js";
import { ContactControllerV2 } from "controllers/v2/ContactController.js";
import { requireRole } from "middlewares/RoleMiddleware.js";
import { UserRole } from "generated/prisma/enums.js";
import { idempotencyMiddleware } from "middlewares/IdempotencyMiddleware.js";

const router = Router();

const controller = resolveController(ContactControllerV2);

// Apply API rate limit to all contact routes (runs after global authMiddleware in routes/index.ts)
// router.use(apiRateLimit);

/**
 * @swagger
 * /v2/contacts:
 *   get:
 *     summary: List contacts with pagination, search, sort, and filter
 *     description: |
 *       Advanced contact listing with two pagination strategies:
 *       - **Cursor pagination** (default): stable, gap-free, use `cursor` + `direction`
 *
 *       - **Offset pagination**: traditional page-based, use `paginationType=offset` + `page`
 *
 *       USERs only see contacts they created. ADMINs see all.
 *     tags: [Contacts v2]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paginationType
 *         schema:
 *           type: string
 *           enum: [cursor, offset]
 *           default: cursor
 *         description: Pagination strategy to use
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor from previous response (cursor pagination only)
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [next, prev]
 *           default: next
 *         description: Pagination direction (cursor pagination only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (offset pagination only)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search across name, email, phone, and address
 *         example: "john"
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name (partial match)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email (partial match)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: "Sort fields, comma-separated. Prefix with - for descending. Example: -createdAt,name"
 *         example: "-createdAt"
 *     responses:
 *       200:
 *         description: Paginated list of contacts
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
 *               meta:
 *                 timestamp: "2024-01-15T10:00:00.000Z"
 *                 pagination:
 *                   nextCursor: "clxyz456"
 *                   prevCursor: null
 *                   hasNext: true
 *                   hasPrev: false
 *                   limit: 10
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Create a new contact
 *     description: Creates a contact owned by the authenticated user.
 *     tags: [Contacts v2]
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
        idempotencyMiddleware(),
        validate(createContactSchema),
        asyncHandler((req, res, next) => controller().create(req, res, next)),
    );

/**
 * @swagger
 * /v2/contacts/{id}:
 *   get:
 *     summary: Get a contact by ID
 *     description: USERs can only fetch their own contacts. ADMINs can fetch any.
 *     tags: [Contacts v2]
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
 *     tags: [Contacts v2]
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
 *     description: Marks the contact as deleted. The record is retained for audit purposes. USERs can only delete their own contacts.
 *     tags: [Contacts v2]
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

/**
 * @swagger
 * /v2/contacts/{id}/history:
 *   get:
 *     summary: Get the full audit history for a contact
 *     description: |
 *       Returns all CREATE, UPDATE, and DELETE audit log entries for the given contact, newest first.
 *       **ADMIN only** - returns 403 for USER role.
 *     tags: [Contacts v2]
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
 *         description: Audit history for the contact
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "claudit001"
 *                   entityType: "Contact"
 *                   entityId: "clxyz789"
 *                   action: "UPDATE"
 *                   oldData:
 *                     name: "John Smith"
 *                   newData:
 *                     name: "Jonathan Smith"
 *                   performedBy: "clxyz123"
 *                   ipAddress: "127.0.0.1"
 *                   createdAt: "2024-01-15T11:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/:id/history").get(
    validate(uuidSchema, "params"),
    requireRole(UserRole.ADMIN),
    asyncHandler((req, res, next) => controller().getHistory(req, res, next)),
);

export { router as contactRoutesV2 };
