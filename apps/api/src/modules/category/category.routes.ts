import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireTenant } from '../../middleware/tenant.middleware';
import { validate } from '../../middleware/validate';
import { createCategorySchema, updateCategorySchema, reorderCategoriesSchema } from '@dineview/shared';
import * as categoryController from './category.controller';

export const categoryRouter = Router();

categoryRouter.use(authenticate, requireTenant);

categoryRouter.get('/', requirePermission('category:read'), categoryController.getAll);
categoryRouter.post('/', requirePermission('category:write'), validate(createCategorySchema), categoryController.create);
categoryRouter.patch('/reorder', requirePermission('category:write'), validate(reorderCategoriesSchema), categoryController.reorder);
categoryRouter.get('/:id', requirePermission('category:read'), categoryController.getById);
categoryRouter.patch('/:id', requirePermission('category:write'), validate(updateCategorySchema), categoryController.update);
categoryRouter.delete('/:id', requirePermission('category:write'), categoryController.remove);
