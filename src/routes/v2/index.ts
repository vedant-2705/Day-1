/**
 * @module routes/v2
 * @description Mounts all v2 resource routers under the `/v2` prefix.
 * v2 introduces cursor and offset pagination, search, filtering, and sorting
 * on the contacts endpoint compared to the basic v1 implementation.
 */

import { Router } from 'express';
import { contactRoutesV2 } from './contactRoutes.js';
import { reportsRoutes } from './reportRoutes.js';

const v2Router = Router();

/** Contact CRUD, history, and advanced query endpoints for API v2. */
v2Router.use('/contacts', contactRoutesV2);

/** Aggregated report endpoints for API v2. */
v2Router.use('/reports', reportsRoutes);

export default v2Router;