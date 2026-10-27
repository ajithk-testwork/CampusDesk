import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Hash,
  Building2,
  Library,
  BookOpen,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ShieldCheck,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import api from "../services/api";
import type { StudentFormData } from "../types/student";

const initialForm: StudentFormData = {
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

const requiredKeys = [
  "full_name",
  "email",
  "phone",
  "register_number",
  "college_name",
  "department",
  "degree",
] as const;

// Added min-w-0 to prevent flexbox blowout from long text in inputs/selects
const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

type FieldProps = {
  label: string;
  icon: ReactNode;
  required?: boolean;
  className?: string;
  topAligned?: boolean;
  select?: boolean;
  children: ReactNode;
};

function Field({
  label,
  icon,
  required,
  className = "",
  topAligned,
  select,
  children,
}: FieldProps) {
  return (
    <label className={`group flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      <div className="relative flex w-full">
        <span
          className={`pointer-events-none absolute left-3.5 text-slate-500 transition group-focus-within:text-indigo-600 ${
            topAligned ? "top-3.5" : "top-1/2 -translate-y-1/2"
          }`}
        >
          {icon}
        </span>
        {children}
        {select && (
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
        )}
      </div>
    </label>
  );
}

type SectionProps = {
  title: string;
  hint: string;
  icon: ReactNode;
  tile: string;
  children: ReactNode;
};

function Section({ title, hint, icon, tile, children }: SectionProps) {
  return (
    <section className="w-full">
      <div className="mb-5 flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tile}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-slate-900">
            {title}
          </h2>
          <p className="truncate text-sm text-slate-600">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const steps = [
  {
    icon: User,
    tile: "bg-indigo-50 text-indigo-600",
    title: "Personal details",
    text: "Name, email, phone and date of birth.",
  },
  {
    icon: GraduationCap,
    tile: "bg-emerald-50 text-emerald-600",
    title: "Academic details",
    text: "Register number, college, department, degree and year.",
  },
  {
    icon: MapPin,
    tile: "bg-amber-50 text-amber-600",
    title: "Address",
    text: "Your current residential address.",
  },
];

export default function StudentRegistration() {
  const [form, setForm] = useState<StudentFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const update = (
    field: keyof StudentFormData,
    value: string | number | null
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const filled = requiredKeys.filter((key) =>
    String(form[key] ?? "").trim()
  ).length;
  const progress = Math.round((filled / requiredKeys.length) * 100);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await api.post("/students", form);
      setSuccess(true);
      setForm({ ...initialForm });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Added relative, w-full, max-w-[100vw], and overflow-x-hidden to strictly block horizontal scrolling
    <main
      className="relative min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-50 text-slate-800"
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <GraduationCap size={21} />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-base font-bold text-slate-900">
                CampusDesk
              </p>
              <p className="truncate text-xs text-slate-600">
                Student registration
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="group inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-3.5"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            <span className="hidden sm:inline">Back to dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-12 lg:py-10">
        {/* Left info panel */}
        <aside className="w-full space-y-5 lg:col-span-4">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
              <ClipboardList size={14} />
              Takes about 3 minutes
            </span>
            <h1 className="mt-4 text-2xl font-bold leading-snug text-slate-900">
              Register as a student
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Fill in your details to complete your enrollment. Fields marked
              with <span className="font-bold text-rose-500">*</span> are
              required.
            </p>

            <ul className="mt-6 hidden space-y-4 sm:block">
              {steps.map(({ icon: Icon, tile, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tile}`}
                  >
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {title}
                    </p>
                    <p className="text-sm text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  Required fields
                </span>
                <span className="font-bold text-indigo-700">
                  {filled}/{requiredKeys.length}
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress === 100 ? "bg-emerald-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-600">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              Your details are saved securely and used only by your college
              administration.
            </p>
          </div>
        </aside>

        {/* Form */}
        <form
          onSubmit={submit}
          className="w-full space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:space-y-8 sm:p-8 lg:col-span-8"
        >
          {success && (
            <div
              role="status"
              className="flex w-full items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600">
                <CheckCircle2 size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-emerald-900">
                  Registration successful
                </p>
                <p className="mt-0.5 text-sm text-emerald-800">
                  Your details have been saved. You can close this page or
                  register another student.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex w-full items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600">
                <AlertCircle size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-rose-900">Registration failed</p>
                <p className="mt-0.5 text-sm text-rose-800">{error}</p>
              </div>
            </div>
          )}

          <Section
            title="Personal information"
            hint="How can we reach you?"
            icon={<User size={19} />}
            tile="bg-indigo-50 text-indigo-600"
          >
            <div className="grid w-full gap-5 sm:grid-cols-2">
              <Field
                label="Full name"
                icon={<User size={17} />}
                required
                className="w-full sm:col-span-2"
              >
                <input
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Jane Doe"
                />
              </Field>

              <Field label="Email address" icon={<Mail size={17} />} required className="w-full">
                <input
                  required
                  type="email"
                  maxLength={150}
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </Field>

              <Field label="Phone number" icon={<Phone size={17} />} required className="w-full">
                <input
                  required
                  type="tel"
                  maxLength={20}
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inputClass}
                  placeholder="+91 98765 43210"
                />
              </Field>

              <Field
                label="Date of birth"
                icon={<Calendar size={17} />}
                className="w-full sm:col-span-2"
              >
                <input
                  type="date"
                  value={form.date_of_birth || ""}
                  onChange={(e) =>
                    update("date_of_birth", e.target.value || null)
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <div className="border-t border-slate-200" />

          <Section
            title="Academic details"
            hint="Your current enrollment information."
            icon={<GraduationCap size={19} />}
            tile="bg-emerald-50 text-emerald-600"
          >
            <div className="grid w-full gap-5 sm:grid-cols-2">
              <Field label="Register number" icon={<Hash size={17} />} required className="w-full">
                <input
                  required
                  maxLength={50}
                  value={form.register_number}
                  onChange={(e) => update("register_number", e.target.value)}
                  className={`${inputClass} uppercase placeholder:normal-case`}
                  placeholder="e.g. CS2026001"
                />
              </Field>

              <Field
                label="College name"
                icon={<Building2 size={17} />}
                required
                className="w-full"
              >
                <input
                  required
                  maxLength={150}
                  value={form.college_name}
                  onChange={(e) => update("college_name", e.target.value)}
                  className={inputClass}
                  placeholder="Enter full college name"
                />
              </Field>

              <Field
                label="Department"
                icon={<Library size={17} />}
                required
                select
                className="w-full sm:col-span-2"
              >
                <select
                  required
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="" disabled>
                    Select department
                  </option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">
                    Information Technology
                  </option>
                  <option value="Commerce">Commerce</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Degree" icon={<BookOpen size={17} />} required className="w-full">
                <input
                  required
                  type="text"
                  value={form.degree}
                  onChange={(e) => update("degree", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. BCA, B.Sc"
                />
              </Field>

              <Field
                label="Year of study"
                icon={<Clock size={17} />}
                required
                select
                className="w-full"
              >
                <select
                  required
                  value={form.year_of_study}
                  onChange={(e) =>
                    update("year_of_study", Number(e.target.value))
                  }
                  className={`${inputClass} appearance-none`}
                >
                  {[1, 2, 3, 4, 5, 6].map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <div className="border-t border-slate-200" />

          <Section
            title="Address"
            hint="Where do you currently live?"
            icon={<MapPin size={19} />}
            tile="bg-amber-50 text-amber-600"
          >
            <Field
              label="Residential address"
              icon={<MapPin size={17} />}
              topAligned
              className="w-full"
            >
              <textarea
                rows={3}
                maxLength={1000}
                value={form.address || ""}
                onChange={(e) => update("address", e.target.value)}
                className={`${inputClass} resize-none`}
                placeholder="House no., street, city, state, PIN code"
              />
            </Field>
          </Section>

          <div className="flex w-full flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="text-center text-sm text-slate-600 sm:text-left">
              Double-check your info before submitting.
            </p>

            <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setForm({ ...initialForm });
                  setError("");
                  setSuccess(false);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 sm:w-auto"
              >
                <RotateCcw size={16} />
                Clear form
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Submit registration
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}