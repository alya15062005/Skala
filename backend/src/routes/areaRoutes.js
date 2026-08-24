import express from "express";
import {
    createArea,
    deleteArea,
    getAllArea,
    getAreaById,
    updateArea
} from "../controller/areaController.js";

const router = express.Router();

router.get("/", getAllArea);
router.get("/:id", getAreaById);
router.post("/", createArea);
router.put("/:id", updateArea);
router.delete("/:id", deleteArea);

export default router;