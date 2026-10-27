
export interface StudentInput {
  full_name: string;
  register_number: string;
  email: string;
  phone: string;
  college_name: string;
  department: string;
  degree: string;
  year_of_study: number;
  date_of_birth?: string | null;
  address?: string | null;
}

export interface Student extends StudentInput {
  id: number;
  created_at: Date;
  updated_at: Date;
}
