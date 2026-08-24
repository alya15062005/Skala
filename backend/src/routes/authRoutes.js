import express from "express";
import { uploadPhoto as uploadPhotoMiddleware } from "../config/multerConfig.js";
import { changePassword, getUserInfo, getUsers, login, updateProfile, uploadPhoto } from "../controller/authController.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", authMiddleware, getUserInfo);
router.put("/me", authMiddleware, updateProfile);
router.post("/upload-photo", authMiddleware, uploadPhotoMiddleware.single("foto"), uploadPhoto);
router.put("/password", authMiddleware, changePassword);
router.get("/users", adminMiddleware, getUsers);

export default router;