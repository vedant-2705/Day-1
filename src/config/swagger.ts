/**
 * @module swaggerConfig
 * @description OpenAPI 3.0 specification configuration for the CRM Lite API.
 *
 * Uses swagger-jsdoc to merge this base spec with JSDoc annotations scattered
 * across route files. swagger-ui-express serves the interactive UI at /api/docs.
 */

import swaggerJsdoc from "swagger-jsdoc";
import { config } from "config/env.js";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",

        //  API metadata
        info: {
            title: "CRM Lite API",
            version: "2.0.0",
            description: `
REST API for CRM Lite - a contacts management system.

## Authentication
This API uses **JWT Bearer tokens** for authentication.

1. Register or log in to receive an \`accessToken\` (short-lived, 15 min) and a \`refreshToken\` (HttpOnly cookie, 7 days).

2. Include the access token in the \`Authorization\` header: \`Bearer <token>\`

3. When the access token expires, call \`POST /api/auth/refresh\` - the refresh token cookie is sent automatically.

## API Versioning
Two versioning strategies are supported:
- **URL versioning** (preferred): \`/api/v1/contacts\`, \`/api/v2/contacts\`

- **Header versioning**: send \`Accept-Version: v2\` with unversioned paths like \`/api/contacts\`

## Roles
- **USER**: Can manage their own contacts. Cannot access admin or report endpoints.

- **ADMIN**: Full access. Can see all contacts, access reports, view audit history, and promote users.
      `.trim(),
            contact: {
                name: "API Support",
            },
        },

        // Servers
        servers: [
            {
                url: `${config.appUrl}/api`,
                description: `${config.env} server`,
            },
        ],

        // Security schemes
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "JWT access token obtained from /auth/login or /auth/register",
                },
            },

            // Reusable schemas
            schemas: {
                // Generic wrappers
                SuccessResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        data: {
                            description:
                                "Response payload - shape varies per endpoint",
                        },
                        meta: {
                            type: "object",
                            properties: {
                                timestamp: {
                                    type: "string",
                                    format: "date-time",
                                },
                                pagination: {
                                    type: "object",
                                    description:
                                        "Present on paginated endpoints",
                                },
                            },
                        },
                    },
                },

                ErrorResponse: {
                    type: "object",
                    required: [
                        "type",
                        "title",
                        "status",
                        "detail",
                        "code",
                        "traceId",
                    ],
                    properties: {
                        type: {
                            type: "string",
                            example: "http://localhost:3000/errors/NOT_FOUND",
                        },
                        title: { type: "string", example: "Not Found" },
                        status: { type: "integer", example: 404 },
                        detail: {
                            type: "string",
                            example: "Contact with id 'abc' was not found",
                        },
                        instance: {
                            type: "string",
                            example: "/api/v1/contacts/abc",
                        },
                        code: { type: "string", example: "NOT_FOUND" },
                        traceId: { type: "string", format: "uuid" },
                        errors: {
                            description: "Validation error details (422 only)",
                        },
                    },
                },

                // Auth schemas
                RegisterRequest: {
                    type: "object",
                    required: ["name", "email", "password"],
                    properties: {
                        name: {
                            type: "string",
                            minLength: 1,
                            maxLength: 255,
                            example: "Jane Doe",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            example: "jane@example.com",
                        },
                        password: {
                            type: "string",
                            minLength: 8,
                            maxLength: 72,
                            description:
                                "Must contain uppercase, lowercase, and a digit",
                            example: "SecurePass1",
                        },
                    },
                },

                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "jane@example.com",
                        },
                        password: { type: "string", example: "SecurePass1" },
                    },
                },

                ChangePasswordRequest: {
                    type: "object",
                    required: [
                        "currentPassword",
                        "newPassword",
                        "confirmPassword",
                    ],
                    properties: {
                        currentPassword: {
                            type: "string",
                            example: "OldPass1",
                        },
                        newPassword: {
                            type: "string",
                            minLength: 8,
                            example: "NewPass1",
                        },
                        confirmPassword: {
                            type: "string",
                            example: "NewPass1",
                        },
                    },
                },

                ForgotPasswordRequest: {
                    type: "object",
                    required: ["email"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "jane@example.com",
                        },
                    },
                },

                ResetPasswordRequest: {
                    type: "object",
                    required: ["token", "newPassword", "confirmPassword"],
                    properties: {
                        token: {
                            type: "string",
                            description:
                                "Token from the reset link query param",
                        },
                        newPassword: {
                            type: "string",
                            minLength: 8,
                            example: "NewPass1",
                        },
                        confirmPassword: {
                            type: "string",
                            example: "NewPass1",
                        },
                    },
                },

                UserDTO: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "clxyz123" },
                        name: { type: "string", example: "Jane Doe" },
                        email: {
                            type: "string",
                            format: "email",
                            example: "jane@example.com",
                        },
                        role: {
                            type: "string",
                            enum: ["USER", "ADMIN"],
                            example: "USER",
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },

                AuthResponse: {
                    type: "object",
                    properties: {
                        user: { $ref: "#/components/schemas/UserDTO" },
                        accessToken: {
                            type: "string",
                            description:
                                "Short-lived JWT (15 min). Store in memory, not localStorage.",
                            example: "eyJhbGciOiJIUzI1NiJ9...",
                        },
                    },
                },

                // Contact schemas
                CreateContactRequest: {
                    type: "object",
                    required: ["name", "email", "phone", "address"],
                    properties: {
                        name: {
                            type: "string",
                            minLength: 2,
                            maxLength: 100,
                            example: "John Smith",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            example: "john@example.com",
                        },
                        phone: {
                            type: "string",
                            pattern: "^[1-9][0-9]{9}$",
                            example: "9876543210",
                        },
                        address: {
                            type: "string",
                            minLength: 5,
                            maxLength: 300,
                            example: "123 Main St, Springfield",
                        },
                    },
                },

                UpdateContactRequest: {
                    type: "object",
                    description: "At least one field must be provided",
                    properties: {
                        name: {
                            type: "string",
                            minLength: 2,
                            maxLength: 100,
                            example: "John Smith",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            example: "john@example.com",
                        },
                        phone: {
                            type: "string",
                            pattern: "^[1-9][0-9]{9}$",
                            example: "9876543210",
                        },
                        address: {
                            type: "string",
                            minLength: 5,
                            maxLength: 300,
                            example: "123 Main St",
                        },
                    },
                },

                ContactDTO: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "clxyz789" },
                        name: { type: "string", example: "John Smith" },
                        email: {
                            type: "string",
                            format: "email",
                            example: "john@example.com",
                        },
                        phone: { type: "string", example: "9876543210" },
                        address: {
                            type: "string",
                            example: "123 Main St, Springfield",
                        },
                        createdBy: { type: "string", example: "clxyz123" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },

                CursorPaginationMeta: {
                    type: "object",
                    properties: {
                        nextCursor: {
                            type: "string",
                            nullable: true,
                            description: "Opaque cursor for the next page",
                        },
                        prevCursor: {
                            type: "string",
                            nullable: true,
                            description: "Opaque cursor for the previous page",
                        },
                        hasNext: { type: "boolean" },
                        hasPrev: { type: "boolean" },
                        limit: { type: "integer" },
                    },
                },

                OffsetPaginationMeta: {
                    type: "object",
                    properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                        hasNext: { type: "boolean" },
                        hasPrev: { type: "boolean" },
                    },
                },

                AuditLog: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        entityType: { type: "string", example: "Contact" },
                        entityId: { type: "string" },
                        action: {
                            type: "string",
                            enum: ["CREATE", "UPDATE", "DELETE"],
                        },
                        oldData: { type: "object", nullable: true },
                        newData: { type: "object", nullable: true },
                        performedBy: { type: "string", example: "clxyz123" },
                        ipAddress: { type: "string", nullable: true },
                        userAgent: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },

                ContactStatsDTO: {
                    type: "object",
                    properties: {
                        total: { type: "integer", example: 142 },
                        addedToday: { type: "integer", example: 5 },
                        mostCommonDomain: {
                            type: "string",
                            nullable: true,
                            example: "gmail.com",
                        },
                        domainBreakdown: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    domain: {
                                        type: "string",
                                        example: "gmail.com",
                                    },
                                    count: { type: "integer", example: 48 },
                                    percentage: {
                                        type: "number",
                                        example: 33.8,
                                    },
                                },
                            },
                        },
                        generatedAt: { type: "string", format: "date-time" },
                    },
                },

                // Upload schemas
                ProfilePictureResponse: {
                    type: "object",
                    properties: {
                        profilePicture: {
                            type: "string",
                            format: "uri",
                            example:
                                "https://res.cloudinary.com/demo/image/upload/v1/production/crm-lite/clxyz/profile/1718123456789-a3f7b2c1.webp",
                        },
                        width: {
                            type: "integer",
                            nullable: true,
                            example: 400,
                        },
                        height: {
                            type: "integer",
                            nullable: true,
                            example: 400,
                        },
                    },
                },

                DocumentDTO: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "clxyz789" },
                        userId: { type: "string", example: "clxyz123" },
                        fileName: {
                            type: "string",
                            example: "contract.pdf",
                            description: "Original filename for display",
                        },
                        publicUrl: {
                            type: "string",
                            format: "uri",
                            example: "https://res.cloudinary.com/...",
                        },
                        mimeType: {
                            type: "string",
                            example: "application/pdf",
                        },
                        sizeBytes: {
                            type: "integer",
                            example: 204800,
                            description: "File size in bytes",
                        },
                        uploadedAt: { type: "string", format: "date-time" },
                    },
                },
            },

            // Reusable responses
            responses: {
                Unauthorized: {
                    description:
                        "Authentication required or access token expired",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                type: "http://localhost:3000/errors/INVALID_TOKEN",
                                title: "Unauthorized",
                                status: 401,
                                detail: "Token is invalid or has expired",
                                code: "INVALID_TOKEN",
                                traceId: "550e8400-e29b-41d4-a716-446655440000",
                            },
                        },
                    },
                },

                Forbidden: {
                    description: "Authenticated but insufficient role",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                type: "http://localhost:3000/errors/INSUFFICIENT_PERMISSIONS",
                                title: "Forbidden",
                                status: 403,
                                detail: "You do not have permission to perform this action",
                                code: "INSUFFICIENT_PERMISSIONS",
                                traceId: "550e8400-e29b-41d4-a716-446655440000",
                            },
                        },
                    },
                },

                NotFound: {
                    description: "Resource not found",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                type: "http://localhost:3000/errors/NOT_FOUND",
                                title: "Not Found",
                                status: 404,
                                detail: "The requested resource was not found",
                                code: "NOT_FOUND",
                                traceId: "550e8400-e29b-41d4-a716-446655440000",
                            },
                        },
                    },
                },

                Conflict: {
                    description: "Resource already exists",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                type: "http://localhost:3000/errors/CONFLICT",
                                title: "Conflict",
                                status: 409,
                                detail: "A resource with this value already exists",
                                code: "CONFLICT",
                                traceId: "550e8400-e29b-41d4-a716-446655440000",
                            },
                        },
                    },
                },

                UnprocessableEntity: {
                    description: "Validation failed",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                type: "http://localhost:3000/errors/VALIDATION_ERROR",
                                title: "Unprocessable Entity",
                                status: 422,
                                detail: "The request contains invalid data",
                                code: "VALIDATION_ERROR",
                                errors: "name: Name must be at least 2 characters",
                                traceId: "550e8400-e29b-41d4-a716-446655440000",
                            },
                        },
                    },
                },

                BadRequest: {
                    description: "Malformed request or invalid input",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                type: "http://localhost:3000/errors/BAD_REQUEST",
                                title: "Bad Request",
                                status: 400,
                                detail: "The request is malformed or missing required fields",
                                code: "BAD_REQUEST",
                                traceId: "550e8400-e29b-41d4-a716-446655440000",
                            },
                        },
                    },
                },
            },
        },

        // Tags (groups endpoints in the UI)
        tags: [
            {
                name: "Auth",
                description:
                    "Registration, login, token management, and password operations",
            },
            {
                name: "Contacts v1",
                description: "Basic contact CRUD (no pagination)",
            },
            {
                name: "Contacts v2",
                description:
                    "Advanced contact CRUD with cursor/offset pagination, search, filter, and sort",
            },
            {
                name: "Reports",
                description: "Aggregated statistics - ADMIN only",
            },
            {
                name: "Admin",
                description: "User management operations - ADMIN only",
            },
            {
                name: "Upload",
                description: "Profile picture and document upload endpoints",
            },
        ],
    },

    // swagger-jsdoc will scan these files for @swagger JSDoc annotations
    apis: [
        // "./src/routes/auth/authRoutes.ts",
        // "./src/routes/v1/contactRoutes.ts",
        // "./src/routes/v1/reportRoutes.ts",
        // "./src/routes/v2/contactRoutes.ts",
        // "./src/routes/v2/reportRoutes.ts",
        // "./src/routes/admin/adminRoutes.ts",
        // "./src/routes/v2/upload/uploadRoutes.ts",

        "./src/routes/**/*.ts",
    ],
};

export const swaggerSpec = swaggerJsdoc(options);
