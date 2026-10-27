
import { Router } from "express";

import {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.ts";

const router = Router();

// Create student
router.post("/", createStudent);


router.get("/", getStudents);


router.put("/:id", updateStudent);


router.delete("/:id", deleteStudent);

export default router;
