
import { Router } from "express";
import multer from "multer";

import {
  getDashboardStats,
  downloadStudentTemplate,
  exportStudentsExcel,
  importStudentsExcel,
  exportStudentsPDF,
} from "../controllers/adminDashboardController.ts";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const allowedExtensions = /\.(xlsx|xls)$/i;

    if (!allowedExtensions.test(file.originalname)) {
      callback(new Error("Only Excel .xlsx and .xls files are allowed"));
      return;
    }

    callback(null, true);
  },
});

router.get("/stats", getDashboardStats);

router.get("/students/template", downloadStudentTemplate);
router.get("/students/export/excel", exportStudentsExcel);
router.get("/students/export/pdf", exportStudentsPDF);

router.post(
  "/students/import",
  upload.single("file"),
  importStudentsExcel
);

export default router;
