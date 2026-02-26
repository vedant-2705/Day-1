/**
 * @module routes/v1
 * @description Mounts all v1 resource routers under the `/v1` prefix.
 * Each resource router is responsible for defining its own endpoint paths
 * and wiring them to the appropriate controller methods.
 */

import { Router } from 'express';
import { contactRoutesV1 } from './contactRoutes.js';
import { reportsRoutes } from './reportRoutes.js';
import { adminRoutes } from 'routes/admin/adminRoutes.js';

const v1Router = Router();

/** Contact CRUD and history endpoints for API v1. */
v1Router.use('/contacts', contactRoutesV1);

/** Aggregated report endpoints for API v1. */
v1Router.use('/reports', reportsRoutes);

/** Admin routes for API v1. */
v1Router.use('/admin', adminRoutes);

export default v1Router;