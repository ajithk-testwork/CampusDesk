
import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { pool } from "../config/database.ts";

interface StudentRow extends RowDataPacket {
  id: number;
  full_name: string;
  register_number: string;
  email: string;
  phone: string;
  college_name: string;
  department: string;
  degree: string;
  year_of_study: number;
  date_of_birth: string | null;
  address: string | null;
  created_at: Date;
}

const studentColumns = [
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

type StudentColumn = (typeof studentColumns)[number];

const readStudents = async (): Promise<StudentRow[]> => {
  const [rows] = await pool.execute<StudentRow[]>(
    `SELECT id, full_name, register_number, email, phone,
      college_name, department, degree, year_of_study,
      date_of_birth, address, created_at
     FROM students ORDER BY id DESC`
  );

  return rows;
};

// GET DASHBOARD STATISTICS
export const getDashboardStats = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS totalStudents,
        COUNT(DISTINCT department) AS totalDepartments,
        COUNT(DISTINCT degree) AS totalCourses
       FROM students`
    );

    const [departments] = await pool.execute<RowDataPacket[]>(
      `SELECT department, COUNT(*) AS studentCount
       FROM students
       GROUP BY department
       ORDER BY studentCount DESC`
    );

    res.json({
      success: true,
      stats: rows[0],
      departments,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics",
    });
  }
};

// DOWNLOAD EXCEL TEMPLATE
export const downloadStudentTemplate = (
  _req: Request,
  res: Response
): void => {
  const example = [
    {
      full_name: "Arun Kumar",
      register_number: "CS2026001",
      email: "arun@example.com",
      phone: "9876543210",
      college_name: "ABC College",
      department: "Computer Science",
      degree: "BCA",
      year_of_study: 2,
      date_of_birth: "2005-05-15",
      address: "Chennai",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(example);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="student-import-template.xlsx"'
  );

  res.send(buffer);
};

// EXPORT ALL STUDENTS TO EXCEL
export const exportStudentsExcel = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const students = await readStudents();

    const worksheet = XLSX.utils.json_to_sheet(students);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="students.xlsx"'
    );

    res.send(buffer);
  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to export students",
    });
  }
};

// IMPORT STUDENTS FROM EXCEL
export const importStudentsExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please upload an Excel file",
      });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      cellDates: false,
    });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      res.status(400).json({
        success: false,
        message: "Excel file contains no worksheets",
      });
      return;
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      worksheet,
      { defval: "" }
    );

    if (rows.length === 0) {
      res.status(400).json({
        success: false,
        message: "Excel sheet contains no student records",
      });
      return;
    }

    if (rows.length > 1000) {
      res.status(400).json({
        success: false,
        message: "Maximum 1000 rows can be imported at once",
      });
      return;
    }

    const requiredColumns = [
      "full_name",
      "register_number",
      "email",
      "phone",
      "college_name",
      "department",
      "degree",
      "year_of_study",
    ];

    const missingColumns = requiredColumns.filter(
      (column) => !(column in rows[0])
    );

    if (missingColumns.length > 0) {
      res.status(400).json({
        success: false,
        message: "Excel columns do not match the template",
        missingColumns,
      });
      return;
    }

    const inserted: number[] = [];
    const errors: { row: number; message: string }[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];

      const getText = (key: StudentColumn): string =>
        String(row[key] ?? "").trim();

      const fullName = getText("full_name");
      const registerNumber = getText("register_number");
      const email = getText("email").toLowerCase();
      const phone = getText("phone");
      const collegeName = getText("college_name");
      const department = getText("department");
      const degree = getText("degree");
      const year = Number(row.year_of_study);

      const excelRow = index + 2;

      if (
        !fullName ||
        !registerNumber ||
        !email ||
        !phone ||
        !collegeName ||
        !department ||
        !degree
      ) {
        errors.push({
          row: excelRow,
          message: "Required fields are missing",
        });
        continue;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({
          row: excelRow,
          message: "Invalid email",
        });
        continue;
      }

      if (!Number.isInteger(year) || year < 1 || year > 6) {
        errors.push({
          row: excelRow,
          message: "Year of study must be between 1 and 6",
        });
        continue;
      }

      const dobText = getText("date_of_birth");
      const dateOfBirth = dobText || null;

      if (
        dateOfBirth &&
        !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
      ) {
        errors.push({
          row: excelRow,
          message: "Date of birth must use YYYY-MM-DD",
        });
        continue;
      }

      try {
        const [result] = await pool.execute<ResultSetHeader>(
          `INSERT INTO students (
            full_name, register_number, email, phone,
            college_name, department, degree, year_of_study,
            date_of_birth, address
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fullName,
            registerNumber,
            email,
            phone,
            collegeName,
            department,
            degree,
            year,
            dateOfBirth,
            getText("address") || null,
          ]
        );

        inserted.push(result.insertId);
      } catch (error) {
        const err = error as { code?: string };

        errors.push({
          row: excelRow,
          message:
            err.code === "ER_DUP_ENTRY"
              ? "Duplicate register number or email"
              : "Unable to save this row",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Excel import processed",
      totalRows: rows.length,
      importedCount: inserted.length,
      failedCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Excel import error:", error);

    res.status(400).json({
      success: false,
      message: "Invalid or unreadable Excel file",
    });
  }
};

// EXPORT STUDENTS TO PDF
export const exportStudentsPDF = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const students = await readStudents();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="students-report.pdf"'
    );

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 30,
      bufferPages: true,
    });

    doc.pipe(res);

    doc.fontSize(18).text("College Student Report", {
      align: "center",
    });

    doc.moveDown(0.5);
    doc.fontSize(10).text(`Total students: ${students.length}`);
    doc.moveDown();

    const columns = [
      { label: "ID", width: 30 },
      { label: "Name", width: 105 },
      { label: "Register No.", width: 85 },
      { label: "Email", width: 145 },
      { label: "Department", width: 90 },
      { label: "Degree", width: 55 },
      { label: "Year", width: 35 },
    ];

    const startX = 30;
    const rowHeight = 24;
    const pageBottom = 540;

    const drawHeader = (): void => {
      let x = startX;

      doc.font("Helvetica-Bold").fontSize(9);

      for (const column of columns) {
        doc.text(column.label, x, doc.y, {
          width: column.width,
          height: rowHeight,
          lineBreak: false,
        });
        x += column.width;
      }

      doc.moveDown(1.5);
      doc.moveTo(startX, doc.y).lineTo(810, doc.y).stroke();
      doc.moveDown(0.5);
    };

    drawHeader();

    for (const student of students) {
      if (doc.y + rowHeight > pageBottom) {
        doc.addPage();
        drawHeader();
      }

      const y = doc.y;
      let x = startX;

      const values = [
        String(student.id),
        student.full_name,
        student.register_number,
        student.email,
        student.department,
        student.degree,
        String(student.year_of_study),
      ];

      doc.font("Helvetica").fontSize(8);

      for (let i = 0; i < columns.length; i++) {
        doc.text(values[i], x, y, {
          width: columns[i].width - 4,
          height: rowHeight,
          lineBreak: false,
          ellipsis: true,
        });

        x += columns[i].width;
      }

      doc.y = y + rowHeight;
    }

    doc.end();
  } catch (error) {
    console.error("PDF export error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Unable to generate student PDF",
      });
    } else {
      res.destroy(error instanceof Error ? error : undefined);
    }
  }
};
