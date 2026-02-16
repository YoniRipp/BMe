/**
 * Group routes.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as groupController from '../controllers/group.js';

const router = Router();

router.get('/api/groups', requireAuth, groupController.list);
router.post('/api/groups', requireAuth, groupController.create);
router.get('/api/groups/invitations/:token', groupController.getInvitationByToken);
router.get('/api/groups/:id', requireAuth, groupController.get);
router.patch('/api/groups/:id', requireAuth, groupController.update);
router.delete('/api/groups/:id', requireAuth, groupController.remove);
router.post('/api/groups/:id/invite', requireAuth, groupController.invite);
router.delete('/api/groups/:id/invitations', requireAuth, groupController.cancelInvite);
router.post('/api/groups/:id/accept', requireAuth, groupController.acceptInvite);
router.delete('/api/groups/:id/members/:userId', requireAuth, groupController.removeMember);
router.post('/api/groups/accept-invite-by-token', requireAuth, groupController.acceptInviteByToken);

export default router;
