/**
 * @module uploadRoutes
 * @description Routes for file upload endpoints.
 * All routes require authentication (applied globally in routes/index.ts).
 *
 * Route table:
 *   POST /upload/profile    - Upload/replace profile picture (image only)
 *   POST /upload/document   - Upload a document (PDF/DOCX/DOC)
 *   GET  /upload/documents  - List all documents for the current user
 */

import { Router } from "express";
import { asyncHandler } from "middlewares/AsyncHandler.js";
import {
    handleProfileUpload,
    handleDocumentUpload,
} from "middlewares/UploadMiddleware.js";
import { resolveController } from "helpers/ControllerResolver.js";
import { UploadController } from "controllers/upload/UploadController.js";

const router = Router();
const controller = resolveController(UploadController);

/**
 * @swagger
 * /upload/profile:
 *   post:
 *     summary: Upload or replace the authenticated user's profile picture
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, GIF, WebP). Max 5 MB.
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 profilePicture: "https://res.cloudinary.com/demo/image/upload/v1/production/crm-lite/clxyz/profile/1718123456789-a3f7b2c1.webp"
 *                 width: 400
 *                 height: 400
 *               meta:
 *                 timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       413:
 *         description: File too large (exceeds 5 MB limit)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    "/profile",
    handleProfileUpload,
    asyncHandler((req, res, next) =>
        controller().uploadProfile(req, res, next),
    ),
);

/**
 * @swagger
 * /upload/document:
 *   post:
 *     summary: Upload a document (PDF, DOCX, or DOC)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file (PDF, DOCX, DOC). Max 10 MB.
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: "clxyz789"
 *                 userId: "clxyz123"
 *                 fileName: "contract.pdf"
 *                 publicUrl: "https://res.cloudinary.com/demo/raw/upload/v1/production/crm-lite/clxyz/documents/2024/06/1718123456789-a3f7b2c1.pdf"
 *                 mimeType: "application/pdf"
 *                 sizeBytes: 204800
 *                 uploadedAt: "2024-01-15T10:30:00.000Z"
 *               meta:
 *                 timestamp: "2024-01-15T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       413:
 *         description: File too large (exceeds 10 MB limit)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    "/document",
    handleDocumentUpload,
    asyncHandler((req, res, next) =>
        controller().uploadDocument(req, res, next),
    ),
);

/**
 * @swagger
 * /upload/documents:
 *   get:
 *     summary: List all documents uploaded by the authenticated user
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents, newest first
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: "clxyz789"
 *                   userId: "clxyz123"
 *                   fileName: "contract.pdf"
 *                   publicUrl: "https://res.cloudinary.com/..."
 *                   mimeType: "application/pdf"
 *                   sizeBytes: 204800
 *                   uploadedAt: "2024-01-15T10:30:00.000Z"
 *               meta:
 *                 timestamp: "2024-01-15T10:30:00.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
    "/documents",
    asyncHandler((req, res, next) => controller().getDocuments(req, res, next)),
);

export { router as uploadRoutes };
