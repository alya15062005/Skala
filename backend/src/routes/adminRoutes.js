import express from "express";
import { createUserAdmin, deleteUserAdmin, getAllUsersAdmin, getDashboardStats, updateUserAdmin } from "../controller/adminController.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Dashboard admin stats
router.get("/dashboard", adminMiddleware, getDashboardStats);

// User management
router.get("/users", adminMiddleware, getAllUsersAdmin);
router.post("/users", adminMiddleware, createUserAdmin);
router.put("/users/:id", adminMiddleware, updateUserAdmin);
router.delete("/users/:id", adminMiddleware, deleteUserAdmin);

export default router;