export type Profile = {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  document_number: string | null;
  city: string | null;
  role: "student" | "admin";
  created_at: string;
};

export type Book = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  author: string;
  description: string;
  price_pyg: number;
  pages: number | null;
  cover_path: string | null;
  file_path: string | null;
  published: boolean;
  created_at: string;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  teacher: string;
  price_pyg: number;
  cover_path: string | null;
  passing_score: number;
  max_attempts: number;
  published: boolean;
  created_at: string;
};

export type Module = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  position: number;
  video_source: "upload" | "youtube" | "live";
  video_path?: string | null;
  video_url?: string | null;
  duration_seconds: number;
  live_at: string | null;
  live_url?: string | null;
  attendance_code?: string | null;
};

export type Order = {
  id: string;
  user_id: string;
  item_type: "book" | "course";
  item_id: string;
  item_title: string;
  amount_pyg: number;
  status: "pending" | "review" | "paid" | "rejected" | "cancelled";
  payment_method: "pagopar" | "transferencia" | "cortesia";
  provider_ref: string | null;
  receipt_path: string | null;
  admin_note: string | null;
  created_at: string;
  paid_at: string | null;
};
