import express from "express";
import { ThresholdsController } from "../controllers/thresholdsController.js";
// --- BARIS INI YANG HILANG ---
import { requireAuth } from "../middleware/authMiddleware.js"; 
// -----------------------------

const router = express.Router();

router.get("/", ThresholdsController.list);

// Sekarang requireAuth sudah dikenal karena sudah di-import di atas
router.post("/", requireAuth, ThresholdsController.create); 

router.get("/latest", ThresholdsController.latest);

export default router;