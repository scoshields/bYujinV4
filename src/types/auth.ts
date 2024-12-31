export interface SignUpData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
}

export interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  height_inches?: number;
  weight_lbs?: number;
  default_level?: 'beginner' | 'intermediate' | 'advanced';
  default_equipment?: string[];
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}