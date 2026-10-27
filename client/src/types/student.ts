
export interface Student {
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
  created_at?: string;
  updated_at?: string;
}

export type StudentFormData = Omit<
  Student,
  "id" | "created_at" | "updated_at"
>;
