"use server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentCourseState, issueCertificateIfEligible } from "@/lib/academic";
import { loadEnrolledCourse } from "../../data";

export async function submitQuiz(formData: FormData) {
  const slug = String(formData.get("slug"));
  const moduleId = String(formData.get("module_id"));
  const { user, course } = await loadEnrolledCourse(slug);
  const state = await getStudentCourseState(user.id, course);
  const mod = state.modules.find((m) => m.id === moduleId);
  const back = `/panel/cursos/${slug}`;
  if (!mod || !mod.unlocked || !mod.lessonsDone || mod.passed || mod.attempts >= course.max_attempts) redirect(back);

  const db = createAdminClient();
  const { data: questions } = await db.from("quiz_questions").select("id, correct_index").eq("module_id", moduleId);
  if (!questions?.length) redirect(back);

  const answers: Record<string, number> = {};
  let correct = 0;
  for (const q of questions) {
    const raw = formData.get(`q_${q.id}`);
    const a = raw === null ? -1 : Number(raw);
    answers[q.id] = a;
    if (a === q.correct_index) correct++;
  }
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= course.passing_score;

  await db.from("quiz_attempts").insert({ user_id: user.id, module_id: moduleId, score, passed, answers });
  if (passed) await issueCertificateIfEligible(user.id, course);

  redirect(`/panel/cursos/${slug}/examen/${moduleId}?nota=${score}&correctas=${correct}&total=${questions.length}`);
}
