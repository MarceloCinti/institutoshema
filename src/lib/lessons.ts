import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Lesson } from "@/lib/types";

/** Devuelve la clase y su curso si el usuario está inscripto (o es admin). */
export async function getLessonForUser(userId: string, lessonId: string, isAdmin = false) {
  const db = createAdminClient();
  const { data: lesson } = await db
    .from("lessons")
    .select("id, module_id, title, description, position, video_source, video_path, video_url, duration_seconds, live_at, live_url, modules(course_id)")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return null;
  const courseId = (lesson.modules as unknown as { course_id: string }).course_id;
  if (!isAdmin) {
    const { data: enr } = await db.from("enrollments").select("user_id").eq("user_id", userId).eq("course_id", courseId).maybeSingle();
    if (!enr) return null;
  }
  return { lesson: lesson as unknown as Lesson, courseId };
}

export function youtubeId(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(url) ? url : null;
}
