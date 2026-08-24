import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import adminRoutes from "./routes/adminRoutes.js";
import areaRoutes from "./routes/areaRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import penugasanRoutes from "./routes/penugasanRoutes.js";
import shiftRoutes from "./routes/shiftRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "upload");

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173';
const localOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173'];
const isPrivateNetworkHost = (hostname) => {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
};

const allowedOrigins = Array.from(new Set([FRONTEND_ORIGIN, ...localOrigins]));
console.log('CORS allowed origins:', allowedOrigins);
app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser requests (e.g., curl, Postman) where origin is undefined
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      try {
        const parsedOrigin = new URL(origin);
        if ((parsedOrigin.protocol === 'http:' || parsedOrigin.protocol === 'https:') && isPrivateNetworkHost(parsedOrigin.hostname)) {
          return callback(null, true);
        }
      } catch {
        // Ignore malformed origins and reject below.
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

// 🔍 DEBUG: Log SEMUA incoming requests
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("   Headers:", req.headers);
  console.log("   Body:", req.body);
  next();
});

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Test route works" });
});

// Root API health check and route overview for Postman manual testing
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API BETA is running",
    info: "Gunakan endpoint /api/auth, /api/admin, /api/area, /api/shift, /api/penugasan untuk pengecekan manual",
    availableRoutes: [
      "/api/auth/login",
      "/api/auth/me",
      "/api/auth/upload-photo",
      "/api/admin/dashboard",
      "/api/admin/users",
      "/api/area",
      "/api/shift",
      "/api/penugasan",
      "/api/penugasan/ob/all",
      "/api/penugasan/tugas/all",
      "/api/penugasan/laporan/all"
    ]
  });
});

console.log("Mounting routes...");
app.use("/api/auth", authRoutes);
console.log("Auth routes mounted");
app.use("/api/penugasan", penugasanRoutes);
console.log("Penugasan routes mounted");
app.use("/api/admin", adminRoutes);
console.log("Admin routes mounted");
app.use("/api/area", areaRoutes);
console.log("Area routes mounted");
app.use("/api/shift", shiftRoutes);
console.log("Shift routes mounted");

// Debug middleware
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Not found", path: req.path });
});

export default app;