import express from "express";
import {
    createShift,
    deleteShift,
    getAllShift,
    getShiftById,
    updateShift
} from "../controller/shiftController.js";

const router = express.Router();

router.get("/", getAllShift);
router.get("/:id", getShiftById);
router.post("/", createShift);
router.put("/:id", updateShift);
router.delete("/:id", deleteShift);

export default router;