import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getAssignedBatches,
  getStudentsByBatch,
  enterMarks,
  getMarksHistory,
} from "../controllers/facultyController.js";

const router = express.Router();

router.get("/batches", protect, authorizeRoles("faculty"), getAssignedBatches);
router.get(
  "/batches/:labBatchId/students",
  protect,
  authorizeRoles("faculty"),
  getStudentsByBatch
);
router.post(
  "/batches/enter-marks",
  protect,
  authorizeRoles("faculty"),
  enterMarks
);
router.get(
  "/batches/:labBatchId/marks",
  protect,
  authorizeRoles("faculty"),
  getMarksHistory
);

export default router;
