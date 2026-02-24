import { Router } from "express";
import { validate } from "middlewares/ValidationMiddleware.js";
import {
    createContactSchema,
    updateContactSchema,
    uuidSchema,
} from "validators/contactValidator.js";
import { asyncHandler } from "middlewares/AsyncHandler.js";
import { resolveController } from "helpers/ControllerResolver.js";
import { ContactController } from "controllers/ContactController.js";

const router = Router();

const controller = resolveController(ContactController);

router
    .route("/")
    .get(asyncHandler((req, res, next) => controller().getAll(req, res, next)))
    .post(
        validate(createContactSchema), 
        asyncHandler((req, res, next) => controller().create(req, res, next))
    );

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

export default router;
