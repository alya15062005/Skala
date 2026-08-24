import express from "express";
import upload from "../config/multerConfig.js";
import {
    createNewAktivitas,
    createNewLaporan,
    createNewOB,
    createNewPenugasan,
    createNewRuangan,
    createNewTugas,
    deleteExistingOB,
    deleteExistingPenugasan,
    deleteExistingTugas,
    getAktivitas,
    getLaporan,
    getLaporanByPenugasan,
    getOB,
    getPenugasan,
    getPenugasanById,
    getRuangan,
    getTugas,
    updateExistingOB,
    updateExistingPenugasan,
    updateExistingTugas,
    updateLaporanController
} from "../controller/penugasanController.js";

const router = express.Router();

// 🔍 DEBUG: Log ke route penugasan
router.use((req, res, next) => {
  console.log(`🎯 Penugasan Route: ${req.method} ${req.path}`);
  next();
});

// LAPORAN ROUTES - HARUS DIDEFINISIKAN PERTAMA (MORE SPECIFIC ROUTES FIRST!)
console.log("🔧 Registering LAPORAN routes...");
router.get("/laporan/all", getLaporan);
console.log("✅ Registered: GET /laporan/all");
router.post("/laporan", upload.single("foto"), createNewLaporan);
console.log("✅ Registered: POST /laporan");
router.put("/laporan/:id_laporan", upload.single("foto"), updateLaporanController);
console.log("✅ Registered: PUT /laporan/:id_laporan");
router.get("/laporan/:id_penugasan", getLaporanByPenugasan);
console.log("✅ Registered: GET /laporan/:id_penugasan");

// OB ROUTES
router.get("/ob/all", getOB);
router.post("/ob", createNewOB);
router.put("/ob/:id", updateExistingOB);
router.delete("/ob/:id", deleteExistingOB);

// RUANGAN ROUTES
router.get("/ruangan/all", getRuangan);
router.post("/ruangan", createNewRuangan);

// TUGAS ROUTES
router.get("/tugas/all", getTugas);
router.post("/tugas", createNewTugas);
router.put("/tugas/:id", updateExistingTugas);
router.delete("/tugas/:id", deleteExistingTugas);

// AKTIVITAS ADMIN ROUTES
router.get("/aktivitas/all", getAktivitas);
router.post("/aktivitas", createNewAktivitas);

// PENUGASAN ROUTES - GENERIC ROUTES COME LAST
router.get("/", getPenugasan);
router.post("/", createNewPenugasan);
router.get("/:id", getPenugasanById);
router.put("/:id", updateExistingPenugasan);
router.delete("/:id", deleteExistingPenugasan);

export default router;
