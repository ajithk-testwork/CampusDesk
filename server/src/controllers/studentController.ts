import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.ts";
import { StudentInput } from "../types/students.ts";

const requiredFields: (keyof StudentInput)[] = [
  "full_name",
  "register_number",
  "email",
  "phone",
  "college_name",
  "department",
  "degree",
];

const allowedFields = [
  "full_name",
  "register_number",
  "email",
  "phone",
  "college_name",
  "department",
  "degree",
  "year_of_study",
  "date_of_birth",
  "address",
] as const;

type StudentValue = string | number | null;

const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

// CREATE STUDENT
export const createStudent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as Partial<StudentInput>;

    for (const field of requiredFields) {
      if (typeof body[field] !== "string" || !body[field]?.trim()) {
        res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
        return;
      }
    }

    const year = Number(body.year_of_study);

    if (!Number.isInteger(year) || year < 1 || year > 6) {
      res.status(400).json({
        success: false,
        message: "Year of study must be between 1 and 6",
      });
      return;
    }

    const email = body.email!.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
      return;
    }

    const dateOfBirth = body.date_of_birth || null;

    if (dateOfBirth && !isValidDate(dateOfBirth)) {
      res.status(400).json({
        success: false,
        message: "Date of birth must be YYYY-MM-DD",
      });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO students (
        full_name,
        register_number,
        email,
        phone,
        college_name,
        department,
        degree,
        year_of_study,
        date_of_birth,
        address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.full_name!.trim(),
        body.register_number!.trim(),
        email,
        body.phone!.trim(),
        body.college_name!.trim(),
        body.department!.trim(),
        body.degree!.trim(),
        year,
        dateOfBirth,
        body.address?.trim() || null,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      studentId: result.insertId,
    });
  } catch (error: unknown) {
    const err = error as { code?: string };

    if (err.code === "ER_DUP_ENTRY") {
      res.status(409).json({
        success: false,
        message: "Register number or email already exists",
      });
      return;
    }

    console.error("Create student error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to register student",
    });
  }
};

// GET ALL STUDENTS
export const getStudents = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        id,
        full_name,
        register_number,
        email,
        phone,
        college_name,
        department,
        degree,
        year_of_study,
        date_of_birth,
        address,
        created_at,
        updated_at
      FROM students
      ORDER BY created_at DESC`,
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      students: rows,
    });
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch students",
    });
  }
};

// UPDATE STUDENT
export const updateStudent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const updates: Record<string, StudentValue> = {};

    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(body, field)) {
        continue;
      }

      const value = body[field];

      if (field === "year_of_study") {
        const year = Number(value);

        if (
          value === null ||
          value === "" ||
          !Number.isInteger(year) ||
          year < 1 ||
          year > 6
        ) {
          res.status(400).json({
            success: false,
            message: "Year of study must be between 1 and 6",
          });
          return;
        }

        updates[field] = year;
        continue;
      }

      if (field === "date_of_birth") {
        if (value === null || value === "") {
          updates[field] = null;
        } else if (typeof value !== "string" || !isValidDate(value)) {
          res.status(400).json({
            success: false,
            message: "Date of birth must be a valid YYYY-MM-DD date",
          });
          return;
        } else {
          updates[field] = value;
        }

        continue;
      }

      if (field === "address") {
        if (value !== null && typeof value !== "string") {
          res.status(400).json({
            success: false,
            message: "Address must be text or null",
          });
          return;
        }

        updates[field] =
          typeof value === "string" ? value.trim() || null : null;

        continue;
      }

      if (typeof value !== "string" || !value.trim()) {
        res.status(400).json({
          success: false,
          message: `${field} must be a non-empty string`,
        });
        return;
      }

      const trimmed = value.trim();

      if (field === "email") {
        const email = trimmed.toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          res.status(400).json({
            success: false,
            message: "Invalid email address",
          });
          return;
        }

        updates[field] = email;
      } else {
        updates[field] = trimmed;
      }
    }

    const columns = Object.keys(updates);

    if (columns.length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update",
      });
      return;
    }

    const setClause = columns.map((column) => `\`${column}\` = ?`).join(", ");

    const values: StudentValue[] = columns.map((column) => updates[column]);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE students SET ${setClause} WHERE id = ?`,
      [...values, id],
    );

    if (result.affectedRows === 0) {
      const [existing] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM students WHERE id = ?",
        [id],
      );

      if (existing.length === 0) {
        res.status(404).json({
          success: false,
          message: "Student not found",
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
    });
  } catch (error: unknown) {
    const err = error as { code?: string };

    if (err.code === "ER_DUP_ENTRY") {
      res.status(409).json({
        success: false,
        message: "Register number or email already exists",
      });
      return;
    }

    console.error("Update student error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update student",
    });
  }
};

// DELETE STUDENT
export const deleteStudent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM students WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Student not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete student",
    });
  }
};
