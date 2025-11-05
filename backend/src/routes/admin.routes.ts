import express from "express";
import { getAllUsers, updateUserRole, toggleUserStatus, getSystemStats } from "../controllers/admin.controller";
import { verifyToken, requireRole } from "../middleware/auth.middleware";
import { UserRole } from "../models/user";

const adminRouter = express.Router();

// Admin Routes - All require ADMIN role
adminRouter.get('/users', verifyToken, requireRole(UserRole.ADMIN), getAllUsers);
adminRouter.get('/stats', verifyToken, requireRole(UserRole.ADMIN), getSystemStats);
adminRouter.put('/users/:userId/role', verifyToken, requireRole(UserRole.ADMIN), updateUserRole);
adminRouter.put('/users/:userId/toggle-status', verifyToken, requireRole(UserRole.ADMIN), toggleUserStatus);

export default adminRouter;

