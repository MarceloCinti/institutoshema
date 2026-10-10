import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentCourseState } from "@/lib/academic";
import SubmitButton from "@/components/SubmitButton";
import { loadEnrolledCourse } from "../../data";
import { submitQuiz } from "./actions";

export default async function ExamenPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; moduleId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { slug, moduleId } = await params;
  const sp = await searchParams;
  const { user, course } = await loadEnrolledCourse(slug);
  const state = await getStudentCourseState(user.id, course);
  const mod = state.modules.find((m) => m.id === moduleId);
  if (!mod) notFound();

  if (sp.nota !== undefined) {
    const score = Number(sp.nota);
    const passed = score >= course.passing_score;
    return (
      <div className="card mx-auto max-w-lg text-center">
        <p className="text-5xl">{passed ? "🎉" : "📖"}</p>
        <h1 className="mt-3 text-2xl font-bold">{passed ? "¡Aprobaste!" : "No alcanzaste la nota mínima"}</h1>
        <p className="mt-2 text-gray-600">
          Respondiste bien {sp.correctas} de {sp.total} preguntas: <strong>{score}%</strong> (mínimo {course.passing_score}%).
        </p>
        {!passed && (
          <p className="mt-2 text-sm text-gray-500">
            Te quedan {Math.max(0, course.max_attempts - mod.attempts)} intentos. Repasá las clases antes de volver a intentarlo.
          </p>
        )}
        {state.certificate && passed && (
          <a href={`/api/certificados/${state.certificate.code}`} className="btn-gold mt-5">🎓 Descargar mi certificado</a>
        )}
        <div className="mt-5">
          <Link href={`/panel/cursos/${slug}`} className="btn-primary">Volver al curso</Link>
        </div>
      </div>
    );
  }

  const blocked = !mod.unlocked || !mod.lessonsDone || mod.passed || mod.attempts >= course.max_attempts;
  if (blocked) {
    return (
      <div className="card text-center">
        <p className="text-gray-700">Este examen no está disponible en este momento.</p>
        <Link href={`/panel/cursos/${slug}`} className="btn-primary mt-4">Volver al curso</Link>
      </div>
    );
  }

  const { data: questions } = await createAdminClient()
    .from("quiz_questions")
    .select("id, question, options, position")
    .eq("module_id", moduleId)
    .order("position");

  return (
    <div>
      <Link href={`/panel/cursos/${slug}`} className="text-sm text-gold-700 hover:underline">← {course.title}</Link>
      <h1 className="mt-2 text-2xl font-bold">Examen: {mod.title}</h1>
      <p className="text-sm text-gray-600">
        Intento {mod.attempts + 1} de {course.max_attempts} · nota mínima {course.passing_score}%
      </p>
      <form action={submitQuiz} className="mt-6 space-y-5">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="module_id" value={moduleId} />
        {(questions ?? []).map((q, i) => (
          <fieldset key={q.id} className="card !p-5">
            <legend className="sr-only">Pregunta {i + 1}</legend>
            <p className="font-semibold text-navy-900">
              {i + 1}. {q.question}
            </p>
            <div className="mt-3 space-y-2">
              {(q.options as string[]).map((opt, j) => (
                <label key={j} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50">
                  <input type="radio" name={`q_${q.id}`} value={j} required />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <SubmitButton className="btn-gold" pendingText="Corrigiendo…" confirm="¿Enviar el examen? Se contará como un intento.">
          Enviar examen
        </SubmitButton>
      </form>
    </div>
  );
}
