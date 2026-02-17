import { Router } from 'express';
import { authenticateSession } from '../../middleware/session.middleware';
import { optionalSession } from '../../middleware/optional-session.middleware';
import * as menuController from './menu.controller';

export const menuRouter = Router();

menuRouter.get('/', optionalSession, menuController.getMenu);
menuRouter.get('/categories/:slug', optionalSession, menuController.getCategoryBySlug);
menuRouter.get('/dishes/:dishId', optionalSession, menuController.getDishDetail);
