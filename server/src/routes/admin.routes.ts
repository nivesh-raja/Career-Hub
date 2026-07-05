import { Router } from 'express';
import { 
  getAdminStats, 
  getAllUsers, 
  updateUser, 
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getActivityLogs
} from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';

const router = Router();

// Apply admin protection
router.use(protect);
router.use(adminOnly);

// Stats
router.get('/stats', getAdminStats);

// User Directory CRUD & Operations
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.put('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Audit logs
router.get('/activity-logs', getActivityLogs);

export default router;
