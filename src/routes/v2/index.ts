import { Router } from 'express';
import { contactRoutesV2 } from './contactRoutes.js';

const v2Router = Router();

v2Router.use('/contacts', contactRoutesV2);

export default v2Router;