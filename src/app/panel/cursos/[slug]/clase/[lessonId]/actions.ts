"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLessonForUser } from "@/lib/lessons";

export async function submitAttendanceCode(formData: FormData) {
  const { user } = await requireUser();
  const lessonId = String(formData.get("lesson_id"));
  const back = String(formData.get("back"));
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!(await getLessonForUser(user.id, lessonId))) redirect("/panel");

  const db = createAdminClient();
  const { data: lesson } = await db.from("lessons").select("attendance_code").eq("id", lessonId).single();
  const expected = (lesson?.attendance_code ?? "").trim().toUpperCase();
  if (!expected || code !== expected) {
    redirect(`${back}?error=${encodeURIComponent("Código de asistencia incorrecto.")}`);
  }
  const now = new Date().toISOString();
  await db.from("lesson_progress").upsert(
    { user_id: user.id, lesson_id: lessonId, attended: true, attended_at: now, attendance_method: "codigo", updated_at: now },
    { onConflict: "user_id,lesson_id" },
  );
  redirect(`${back}?ok=${encodeURIComponent("¡Asistencia registrada!")}`);
}
