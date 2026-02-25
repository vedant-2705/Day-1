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
import { ContactControllerV2 } from "controllers/v2/ContactController.js";

const router = Router();

const controller = resolveController(ContactControllerV2);

/**
 * - GET /contacts - list all 
 * - POST /contacts - create new (requires valid body)
 */
router
    .route("/")
    .get(asyncHandler((req, res, next) => controller().getAll(req, res, next)))
    .post(
        validate(createContactSchema), 
        asyncHandler((req, res, next) => controller().create(req, res, next))
    );

/**
 * - GET /contacts/:id - get by id (requires valid UUID in params)
 * - PATCH /contacts/:id - update by id (requires valid UUID in params + body)
 * - DELETE /contacts/:id - delete by id (requires valid UUID in params)
 */
router
    .route("/:id")
    .get(
        validate(uuidSchema, "params"), 
        asyncHandler((req, res, next) => controller().getById(req, res, next))
    )
    .patch(
        validate(uuidSchema, "params"),
        validate(updateContactSchema),
        asyncHandler((req, res, next) => controller().update(req, res, next)),
    )
    .delete(
        validate(uuidSchema, "params"), 
        asyncHandler((req, res, next) => controller().delete(req, res, next))
    );

router.route("/:id/history")
    .get(
        validate(uuidSchema, "params"),
        asyncHandler((req, res, next) => controller().getHistory(req, res, next)),
    );

export { router as contactRoutesV2 };
