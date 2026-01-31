import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  addUser,
  addLab,
  assignLab,
  generateBatches,
  incrementSemester,
  getUsers,
  getLabs,
  getLabAssignments,
  getBatchesForAssignment,
  bulkImportUsers,
  bulkImportLabs,
  deleteUser,
  deleteLab,
  updateBatchStudents,
  deleteAssignment,
} from "../controllers/adminController.js";

const router = express.Router();

router.post("/addUser", protect, authorizeRoles("admin"), addUser);
router.delete("/users/:userId", protect, authorizeRoles("admin"), deleteUser);
router.get("/users", protect, authorizeRoles("admin"), getUsers);
router.post(
  "/bulk-import-users",
  protect,
  authorizeRoles("admin"),
  bulkImportUsers
);

router.post("/addLab", protect, authorizeRoles("admin"), addLab);
router.delete("/labs/:labId", protect, authorizeRoles("admin"), deleteLab);
router.get("/labs", protect, authorizeRoles("admin"), getLabs);
router.post(
  "/bulk-import-labs",
  protect,
  authorizeRoles("admin"),
  bulkImportLabs
);

router.post("/assignLab", protect, authorizeRoles("admin"), assignLab);
router.delete("/assignments/:assignmentId", protect, authorizeRoles("admin"), deleteAssignment);
router.post(
  "/generateBatches",
  protect,
  authorizeRoles("admin"),
  generateBatches
);
router.post(
  "/incrementSemester",
  protect,
  authorizeRoles("admin"),
  incrementSemester
);
router.get(
  "/assignments",
  protect,
  authorizeRoles("admin"),
  getLabAssignments
);
router.get(
  "/assignments/:assignmentId/batches",
  protect,
  authorizeRoles("admin"),
  getBatchesForAssignment
);
router.put(
  "/batches/:labBatchId/students",
  protect,
  authorizeRoles("admin"),
  updateBatchStudents
);

export default router;
