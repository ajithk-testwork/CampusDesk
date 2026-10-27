import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import type { Student, StudentFormData } from "../types/student";
import {
  Users,
  GraduationCap,
  BookOpen,
  Search,
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Pencil,
  Trash2,
  LayoutDashboard,
  RefreshCw,
  X,
  Menu,
  AlertCircle,
  Link2,
  ExternalLink,
  CheckCircle2,
  Copy,
  School,
  UserPlus,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Building2,
  ChevronDown,
} from "lucide-react";

const emptyForm: StudentFormData = {
  full_name: "",
  register_number: "",
  email: "",
  phone: "",
  college_name: "",
  department: "",
  degree: "",
  year_of_study: 1,
  date_of_birth: null,
  address: "",
};

const PAGE_SIZE = 8;

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

// Soft tinted badge colours, used consistently for departments
const badgeTones = [
  "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "bg-amber-50 text-amber-800 ring-amber-200",
  "bg-rose-50 text-rose-700 ring-rose-200",
  "bg-sky-50 text-sky-700 ring-sky-200",
  "bg-violet-50 text-violet-700 ring-violet-200",
];

const avatarTones = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

const hash = (text: string) =>
  [...(text || "S")].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

const barColors = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
];

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const btnGhost =
  "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100";
const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:opacity-60";

type DashboardStats = {
  totalStudents: number;
  totalDepartments: number;
  totalCourses: number;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalDepartments: 0,
    totalCourses: 0,
  });

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentFormData>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [deptFilter, setDeptFilter] = useState("All");
  const [menu, setMenu] = useState<"import" | "export" | null>(null);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState("");

  const registrationUrl = `${window.location.origin}/student-registration`;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [studentResponse, statsResponse] = await Promise.all([
        api.get("/students"),
        api.get("/admin/stats"),
      ]);

      const studentPayload = studentResponse.data;
      const studentList = Array.isArray(studentPayload)
        ? studentPayload
        : studentPayload.students ?? studentPayload.data ?? [];

      setStudents(Array.isArray(studentList) ? studentList : []);

      const statsPayload = statsResponse.data.stats ?? statsResponse.data;

      setStats({
        totalStudents: Number(statsPayload.totalStudents ?? 0),
        totalDepartments: Number(statsPayload.totalDepartments ?? 0),
        totalCourses: Number(statsPayload.totalCourses ?? 0),
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(
        "Unable to load data. Check whether the backend is running and the API response format is correct."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [search, deptFilter]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Dynamically calculate accurate live stats based on the fetched table to fix any update lag
  const displayStats = useMemo(() => {
    const liveTotal = students.length;
    const liveDepts = new Set(students.map((s) => s.department).filter(Boolean)).size;
    const liveCourses = new Set(students.map((s) => s.degree).filter(Boolean)).size;

    return {
      totalStudents: liveTotal > 0 ? liveTotal : stats.totalStudents,
      totalDepartments: liveDepts > 0 ? liveDepts : stats.totalDepartments,
      totalCourses: liveCourses > 0 ? liveCourses : stats.totalCourses,
    };
  }, [students, stats]);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(students.map((s) => s.department).filter(Boolean))
      ).sort(),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool =
      deptFilter === "All"
        ? students
        : students.filter((s) => s.department === deptFilter);

    if (!query) return pool;

    return pool.filter((student) =>
      [
        student.full_name,
        student.register_number,
        student.email,
        student.phone,
        student.department,
        student.college_name,
        student.degree,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [students, search, deptFilter]);

  const copyRegistrationLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setNotice("Registration link copied. You can now share it.");
      setError("");
    } catch {
      setError(
        "Clipboard access failed. Copy this URL manually: " + registrationUrl
      );
    }
  };

  const openRegistrationInNewTab = () => {
    window.open(registrationUrl, "_blank", "noopener,noreferrer");
  };

  const openEdit = (student: Student) => {
    setEditing(student);

    setForm({
      full_name: student.full_name,
      register_number: student.register_number,
      email: student.email,
      phone: student.phone,
      college_name: student.college_name,
      department: student.department,
      degree: student.degree || "",
      year_of_study: student.year_of_study,
      date_of_birth: student.date_of_birth?.slice(0, 10) || null,
      address: student.address || "",
    });

    setModalOpen(true);
    setError("");
    setNotice("");
  };

  const updateField = (
    key: keyof StudentFormData,
    value: string | number | null
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const saveStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editing) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await api.put(`/students/${editing.id}`, form);

      setModalOpen(false);
      setEditing(null);
      setNotice("Student details updated successfully.");

      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Unable to update student details."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (student: Student) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.full_name}?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/students/${student.id}`);
      setNotice("Student deleted successfully.");
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to delete student.");
    }
  };

  const downloadFile = async (path: string, filename: string) => {
    setError("");

    try {
      const response = await api.get(path, {
        responseType: "blob",
      });

      const objectUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download error:", err);
      setError(
        "File download failed. Please check the backend export endpoint."
      );
    }
  };

  const importExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImporting(true);
    setError("");
    setNotice("");
    setImportResult("");

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await api.post("/admin/students/import", body);

      const result = response.data;

      setImportResult(
        `Imported: ${result.importedCount ?? 0} · Failed: ${
          result.failedCount ?? 0
        } · Total: ${result.totalRows ?? 0}`
      );

      if (result.errors?.length) {
        console.table(result.errors);
        setError(
          `${result.errors.length} row(s) could not be imported. Check the browser console for row errors.`
        );
      } else {
        setNotice("Excel import completed successfully.");
      }

      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Excel import failed.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  // Upgraded Stat Items with Circular Progress values
  const statItems = [
    {
      title: "Total students",
      value: displayStats.totalStudents,
      icon: Users,
      ringColor: "text-indigo-500",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      percent: 85,
    },
    {
      title: "Departments",
      value: displayStats.totalDepartments,
      icon: GraduationCap,
      ringColor: "text-emerald-500",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      percent: 65,
    },
    {
      title: "Courses",
      value: displayStats.totalCourses,
      icon: BookOpen,
      ringColor: "text-amber-500",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      percent: 45,
    },
  ];

  const initial = (name: string) => name?.trim().charAt(0).toUpperCase() || "S";

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredStudents.slice(pageStart, pageStart + PAGE_SIZE);

  const yearCounts = useMemo(() => {
    const counts = [1, 2, 3, 4].map((y) => ({
      label: `Year ${y}`,
      count: students.filter((s) => Number(s.year_of_study) === y).length,
    }));
    return counts;
  }, [students]);
  const maxYear = Math.max(1, ...yearCounts.map((y) => y.count));

  const deptCounts = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => {
      const key = s.department || "Other";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [students]);
  const maxDept = Math.max(1, ...deptCounts.map(([, n]) => n));

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800"
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <School size={21} />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">CampusDesk</p>
            <p className="text-xs text-slate-500">Student management</p>
          </div>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
          <div>
            <p className="mb-2 px-3 text-xs font-semibold text-slate-500">Menu</p>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                <LayoutDashboard size={17} />
              </span>
              Dashboard
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">College admin</p>
              <p className="text-xs text-slate-500">Management portal</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Overview of your student records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className={`${btnGhost} disabled:opacity-50`}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <div className="min-w-0">
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-1 break-words">{error}</p>
                {error.includes("Copy this URL manually:") && (
                  <p className="mt-2 break-all font-medium">{registrationUrl}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
                className="ml-auto rounded-md p-1 hover:bg-rose-100"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {importResult && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-medium text-sky-900">
              Excel import result: {importResult}
            </div>
          )}

          {/* New Circular KPI cards */}
          <section className="grid gap-5 sm:grid-cols-3">
            {statItems.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={`${card} flex items-center gap-5 p-6 hover:shadow-md transition-shadow`}
                >
                  <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center">
                    {/* SVG Circular Progress */}
                    <svg
                      className="absolute inset-0 h-full w-full -rotate-90 transform"
                      viewBox="0 0 36 36"
                    >
                      {/* Background Track */}
                      <path
                        className="text-slate-100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      {/* Progress Indicator */}
                      <path
                        className={item.ringColor}
                        strokeDasharray={`${item.percent}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Icon container inside the circle */}
                    <div
                      className={`relative flex h-11 w-11 items-center justify-center rounded-full ${item.bgColor} ${item.iconColor}`}
                    >
                      <Icon size={22} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                      {item.title}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {loading ? "–" : item.value.toLocaleString()}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Insights */}
          <section className="grid gap-5 lg:grid-cols-3">
            <div className={`${card} p-5`}>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <BarChart3 size={18} />
                </span>
                <h2 className="font-bold text-slate-900">Students by year</h2>
              </div>
              <div className="mt-6 flex h-36 items-end gap-4">
                {yearCounts.map((y, i) => (
                  <div
                    key={y.label}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-xs font-bold text-slate-700">
                      {y.count}
                    </span>
                    <div className="flex h-24 w-full items-end rounded-lg bg-slate-100">
                      <div
                        className={`w-full rounded-lg ${
                          barColors[i % barColors.length]
                        }`}
                        style={{
                          height: `${Math.max(
                            6,
                            (y.count / maxYear) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-600">{y.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${card} p-5`}>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Building2 size={18} />
                </span>
                <h2 className="font-bold text-slate-900">Top departments</h2>
              </div>
              {deptCounts.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No data yet.
                </p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {deptCounts.map(([name, count], i) => (
                    <li key={name}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="truncate font-medium text-slate-700">
                          {name}
                        </span>
                        <span className="font-bold text-slate-900">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${
                            barColors[i % barColors.length]
                          }`}
                          style={{ width: `${(count / maxDept) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-sky-50 p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                  <Link2 size={18} />
                </span>
                <h2 className="font-bold text-slate-900">Registration link</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Share this form with students so they can submit their own
                details.
              </p>
              <div className="mt-4 truncate rounded-lg border border-indigo-100 bg-white px-3 py-2.5 text-sm text-slate-700">
                {registrationUrl}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => void copyRegistrationLink()}
                  className={`${btnPrimary} flex-1 justify-center`}
                >
                  <Copy size={15} />
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={openRegistrationInNewTab}
                  className={`${btnGhost} flex-1 justify-center`}
                >
                  <ExternalLink size={15} />
                  Open
                </button>
              </div>
            </div>
          </section>

          {/* Directory */}
          <section className={card}>
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Student directory
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  {filteredStudents.length} record(s)
                  {search.trim() || deptFilter !== "All"
                    ? " match your filters"
                    : " available"}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {menu && (
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMenu(null)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                )}

                <div className="relative z-40">
                  <button
                    type="button"
                    onClick={() => setMenu(menu === "import" ? null : "import")}
                    className={btnGhost}
                    aria-expanded={menu === "import"}
                  >
                    <Upload size={15} className="text-amber-600" />
                    {importing ? "Importing..." : "Import"}
                    <ChevronDown size={15} />
                  </button>
                  {menu === "import" && (
                    <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-slate-50">
                        <Upload size={18} className="mt-0.5 text-amber-600" />
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">
                            Upload Excel file
                          </span>
                          <span className="block text-xs text-slate-600">
                            Add many students from a filled template.
                          </span>
                        </span>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          disabled={importing}
                          onChange={(event) => {
                            setMenu(null);
                            void importExcel(event);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMenu(null);
                          void downloadFile(
                            "/admin/students/template",
                            "student-import-template.xlsx"
                          );
                        }}
                        className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-slate-50"
                      >
                        <Download size={18} className="mt-0.5 text-sky-600" />
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">
                            Download template
                          </span>
                          <span className="block text-xs text-slate-600">
                            Get the blank sheet. Fill one student per row.
                          </span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative z-40">
                  <button
                    type="button"
                    onClick={() => setMenu(menu === "export" ? null : "export")}
                    className={btnGhost}
                    aria-expanded={menu === "export"}
                  >
                    <Download size={15} className="text-emerald-600" />
                    Export
                    <ChevronDown size={15} />
                  </button>
                  {menu === "export" && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setMenu(null);
                          void downloadFile(
                            "/admin/students/export/excel",
                            "students.xlsx"
                          );
                        }}
                        className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-slate-50"
                      >
                        <FileSpreadsheet
                          size={18}
                          className="mt-0.5 text-emerald-600"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">
                            Excel (.xlsx)
                          </span>
                          <span className="block text-xs text-slate-600">
                            All student records.
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenu(null);
                          void downloadFile(
                            "/admin/students/export/pdf",
                            "students-report.pdf"
                          );
                        }}
                        className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-slate-50"
                      >
                        <FileText size={18} className="mt-0.5 text-rose-600" />
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">
                            PDF report
                          </span>
                          <span className="block text-xs text-slate-600">
                            A printable student list.
                          </span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, number, email"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-72"
                  />
                </div>
                <select
                  value={deptFilter}
                  onChange={(event) => setDeptFilter(event.target.value)}
                  aria-label="Filter by department"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="All">All departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Register number</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Course / year</th>
                    <th className="px-5 py-3.5">Contact</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-16 text-center text-slate-600"
                      >
                        <RefreshCw
                          size={22}
                          className="mx-auto mb-3 animate-spin text-indigo-500"
                        />
                        Loading student records...
                      </td>
                    </tr>
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                          <Users size={26} />
                        </div>
                        <p className="mt-4 font-semibold text-slate-900">
                          No students found
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Add a student or try a different search.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((student) => (
                      <tr
                        key={student.id}
                        className="transition hover:bg-indigo-50/40"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                                avatarTones[
                                  hash(student.full_name) % avatarTones.length
                                ]
                              }`}
                            >
                              {initial(student.full_name)}
                            </div>
                            <p className="font-semibold text-slate-900">
                              {student.full_name}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">
                          {student.register_number}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                              badgeTones[
                                hash(student.department) % badgeTones.length
                              ]
                            }`}
                          >
                            {student.department}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-800">
                            {student.degree}
                          </p>
                          <p className="text-xs text-slate-600">
                            Year {student.year_of_study}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <p className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-500" />
                            {student.email}
                          </p>
                          <p className="mt-1 flex items-center gap-2">
                            <Phone size={14} className="text-slate-500" />
                            {student.phone}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(student)}
                              aria-label={`Edit ${student.full_name}`}
                              title="Edit"
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteStudent(student)}
                              aria-label={`Delete ${student.full_name}`}
                              title="Delete"
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-5 py-3.5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredStudents.length === 0 ? 0 : pageStart + 1}–
                {Math.min(pageStart + PAGE_SIZE, filteredStudents.length)} of{" "}
                {filteredStudents.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>
                <span className="px-2 font-semibold text-slate-800">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label="Next page"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Toast */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white py-3 pl-3 pr-3 text-sm font-medium text-slate-800 shadow-xl"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={18} />
          </span>
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Edit modal */}
      {modalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${
                    avatarTones[hash(editing.full_name) % avatarTones.length]
                  }`}
                >
                  {initial(editing.full_name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Edit student
                  </h3>
                  <p className="text-xs text-slate-600">
                    Update academic and contact details.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close edit form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveStudent} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* 
                  Manual Input fields iteration.
                  Includes 'degree' as a manual string text field per request 
                */}
                {(
                  [
                    ["full_name", "Full name"],
                    ["register_number", "Register number"],
                    ["email", "Email address"],
                    ["phone", "Phone number"],
                    ["college_name", "College name"],
                    ["department", "Department"],
                    ["degree", "Degree"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="text-sm font-semibold text-slate-700"
                  >
                    {label} *
                    <input
                      required
                      type={key === "email" ? "email" : "text"}
                      value={form[key] as string}
                      onChange={(event) =>
                        updateField(key, event.target.value)
                      }
                      className={inputClass}
                      placeholder={key === "degree" ? "e.g. BCA, B.Sc" : ""}
                    />
                  </label>
                ))}

                <label className="text-sm font-semibold text-slate-700">
                  Year of study *
                  <select
                    required
                    value={form.year_of_study}
                    onChange={(event) =>
                      updateField("year_of_study", Number(event.target.value))
                    }
                    className={inputClass}
                  >
                    {[1, 2, 3, 4, 5, 6].map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-700">
                  Date of birth
                  <input
                    type="date"
                    value={form.date_of_birth || ""}
                    onChange={(event) =>
                      updateField("date_of_birth", event.target.value || null)
                    }
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Address
                  <textarea
                    rows={3}
                    value={form.address || ""}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={btnGhost}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}