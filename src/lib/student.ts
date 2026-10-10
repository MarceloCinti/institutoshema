import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentCourseState } from "@/lib/academic";
import type { Course } from "@/lib/types";

export async function getMyCourses(userId: string) {
  const db = createAdminClient();
  const { data } = await db.from("enrollments").select("created_at, courses(*)").eq("user_id", userId).order("created_at", { ascending: false });
  const courses = (data ?? []).map((e) => e.courses as unknown as Course).filter(Boolean);
  return Promise.all(courses.map(async (c) => ({ course: c, state: await getStudentCourseState(userId, c) })));
}
