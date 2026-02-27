import { Router } from 'express';
import { GroupsController } from '../controllers/groups.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validator.middleware';
import {
  createGroupSchema,
  updateGroupSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '../types/groups.types';

const router = Router();

router.use(authMiddleware);

router.get('/', GroupsController.getAll);
router.get('/:id', GroupsController.getById);
router.post('/', validateRequest(createGroupSchema), GroupsController.create);
router.put('/:id', validateRequest(updateGroupSchema), GroupsController.update);
router.delete('/:id', GroupsController.delete);
router.post(
  '/:id/invite',
  validateRequest(inviteMemberSchema),
  GroupsController.inviteMember
);
router.put(
  '/:id/members/:memberId/role',
  validateRequest(updateMemberRoleSchema),
  GroupsController.updateMemberRole
);
router.delete('/:id/members/:memberId', GroupsController.removeMember);

export default router;