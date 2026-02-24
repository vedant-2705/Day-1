import { Router } from 'express';
import { contactRoutesV1 } from './contactRoutes.js';

const v1Router = Router();

v1Router.use('/contacts', contactRoutesV1);

export default v1Router;