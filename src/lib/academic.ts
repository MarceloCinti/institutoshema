import "server-only";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Course, Lesson, Module } from "@/lib/types";

/** Porcentaje del video que debe reproducirse para registrar la asistencia. */
export const ATTENDANCE_THRESHOLD = 0.9;

const LESSON_PUBLIC_COLS =
  "id, module_id, title, description, position, video_source, video_path, video_url, duration_seconds, live_at, live_url";

export type ModuleState = Module & {
  lessons: (Lesson & { attended: boolean; watched_seconds: number })[];
  questionCount: number;
  bestScore: number | null;
  attempts: number;
  passed: boolean;
  lessonsDone: boolean;
  unlocked: boolean;
};

export async function getCourseOutline(courseId: string) {
  const db = createAdminClient();
  const { data: modules } = await db
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("position");
  const moduleIds = (modules ?? []).map((m) => m.id);
  const [{ data: lessons }, { data: questions }] = await Promise.all([
    moduleIds.length
      ? db.from("lessons").select(LESSON_PUBLIC_COLS).in("module_id", moduleIds).order("position")
      : Promise.resolve({ data: [] as Lesson[] }),
    moduleIds.length
      ? db.from("quiz_questions").select("module_id").in("module_id", moduleIds)
      : Promise.resolve({ data: [] as { module_id: string }[] }),
  ]);
  return (modules ?? []).map((m) => ({
    ...(m as Module),
    lessons: ((lessons ?? []) as Lesson[]).filter((l) => l.module_id === m.id),
    questionCount: (questions ?? []).filter((q) => q.module_id === m.id).length,
  }));
}

export async function getStudentCourseState(userId: string, course: Course) {
  const db = createAdminClient();
  const outline = await getCourseOutline(course.id);
  const lessonIds = outline.flatMap((m) => m.lessons.map((l) => l.id));
  const moduleIds = outline.map((m) => m.id);

  const [{ data: progress }, { data: attempts }, { data: certificate }] = await Promise.all([
    lessonIds.length
      ? db.from("lesson_progress").select("lesson_id, attended, watched_seconds").eq("user_id", userId).in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] as { lesson_id: string; attended: boolean; watched_seconds: number }[] }),
    moduleIds.length
      ? db.from("quiz_attempts").select("module_id, score, passed").eq("user_id", userId).in("module_id", moduleIds)
      : Promise.resolve({ data: [] as { module_id: string; score: number; passed: boolean }[] }),
    db.from("certificates").select("*").eq("user_id", userId).eq("course_id", course.id).maybeSingle(),
  ]);

  let previousPassed = true;
  const modules: ModuleState[] = outline.map((m) => {
    const lessons = m.lessons.map((l) => {
      const p = progress?.find((x) => x.lesson_id === l.id);
      return { ...l, attended: !!p?.attended, watched_seconds: p?.watched_seconds ?? 0 };
    });
    const mine = (attempts ?? []).filter((a) => a.module_id === m.id);
    const bestScore = mine.length ? Math.max(...mine.map((a) => a.score)) : null;
    const lessonsDone = lessons.every((l) => l.attended);
    const passed = lessonsDone && (m.questionCount === 0 || mine.some((a) => a.passed));
    const unlocked = previousPassed;
    previousPassed = previousPassed && passed;
    return { ...m, lessons, bestScore, attempts: mine.length, passed, lessonsDone, unlocked };
  });

  const totalLessons = lessonIds.length;
  const attendedLessons = modules.reduce((n, m) => n + m.lessons.filter((l) => l.attended).length, 0);
  const totalSteps = totalLessons + modules.filter((m) => m.questionCount > 0).length;
  const doneSteps = attendedLessons + modules.filter((m) => m.questionCount > 0 && m.passed).length;
  const percent = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
  const completed = modules.length > 0 && modules.every((m) => m.passed);

  return { modules, totalLessons, attendedLessons, percent, completed, certificate };
}

function newCertificateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  let code = "";
  for (let i = 0; i < 10; i++) code += alphabet[bytes[i] % alphabet.length];
  return `IS-${code.slice(0, 5)}-${code.slice(5)}`;
}

/** Emite el certificado si el alumno completó todas las clases y aprobó todos los exámenes. */
export async function issueCertificateIfEligible(userId: string, course: Course) {
  const state = await getStudentCourseState(userId, course);
  if (!state.completed) return null;
  if (state.certificate) return state.certificate;

  const db = createAdminClient();
  const { data: profile } = await db.from("profiles").select("full_name, email").eq("id", userId).single();
  const scored = state.modules.filter((m) => m.questionCount > 0 && m.bestScore !== null);
  const finalScore = scored.length ? Math.round(scored.reduce((s, m) => s + (m.bestScore ?? 0), 0) / scored.length) : 100;

  const { data } = await db
    .from("certificates")
    .insert({
      code: newCertificateCode(),
      user_id: userId,
      course_id: course.id,
      student_name: profile?.full_name || profile?.email || "Alumno",
      course_title: course.title,
      final_score: finalScore,
    })
    .select()
    .single();
  return data;
}
