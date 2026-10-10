import Link from "next/link";
import { getStudentCourseState, issueCertificateIfEligible } from "@/lib/academic";
import { formatDuration } from "@/lib/format";
import ProgressBar from "@/components/ProgressBar";
import { loadEnrolledCourse } from "./data";

export default async function CursoAlumno({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, course } = await loadEnrolledCourse(slug);
  let state = await getStudentCourseState(user.id, course);
  if (state.completed && !state.certificate) {
    await issueCertificateIfEligible(user.id, course);
    state = await getStudentCourseState(user.id, course);
  }

  return (
    <div>
      <Link href="/panel/cursos" className="text-sm text-gold-700 hover:underline">← Mis cursos</Link>
      <h1 className="mt-2 text-2xl font-bold">{course.title}</h1>
      <div className="card mt-4 !p-5">
        <ProgressBar value={state.percent} label="Progreso del curso" />
        <p className="mt-2 text-xs text-gray-500">
          Para obtener el certificado: asistencia en todas las clases y aprobar el examen de cada módulo con al menos{" "}
          {course.passing_score}% ({course.max_attempts} intentos por examen).
        </p>
        {state.certificate && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gold-50 p-4">
            <p className="font-semibold text-gold-700">🎓 ¡Felicitaciones! Completaste el curso.</p>
            <a href={`/api/certificados/${state.certificate.code}`} className="btn-gold">Descargar certificado (PDF)</a>
          </div>
        )}
      </div>

      <ol className="mt-6 space-y-5">
        {state.modules.map((m, i) => (
          <li key={m.id} className={`card !p-5 ${m.unlocked ? "" : "opacity-60"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy-900">
                Módulo {i + 1}: {m.title}
              </p>
              {m.passed ? (
                <span className="badge bg-emerald-100 text-emerald-800">Aprobado{m.bestScore !== null ? ` · ${m.bestScore}%` : ""}</span>
              ) : !m.unlocked ? (
                <span className="badge bg-gray-100 text-gray-600">🔒 Aprobá el módulo anterior</span>
              ) : null}
            </div>
            <ul className="mt-3 divide-y divide-gray-100">
              {m.lessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  {m.unlocked ? (
                    <Link href={`/panel/cursos/${course.slug}/clase/${l.id}`} className="flex-1 hover:text-gold-700">
                      {l.attended ? "✅" : l.video_source === "live" ? "🔴" : "▶️"} {l.title}
                    </Link>
                  ) : (
                    <span className="flex-1">🔒 {l.title}</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {l.attended ? "Asistencia registrada" : formatDuration(l.duration_seconds)}
                  </span>
                </li>
              ))}
            </ul>
            {m.questionCount > 0 && m.unlocked && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-navy-50 px-4 py-3 text-sm">
                <span>
                  ✎ Examen del módulo · {m.questionCount} preguntas · intentos: {m.attempts}/{course.max_attempts}
                  {m.bestScore !== null && ` · mejor nota ${m.bestScore}%`}
                </span>
                {m.passed ? null : !m.lessonsDone ? (
                  <span className="text-xs text-gray-500">Disponible al completar la asistencia de todas las clases</span>
                ) : m.attempts >= course.max_attempts ? (
                  <span className="text-xs text-red-700">Sin intentos. Comunicate con el instituto.</span>
                ) : (
                  <Link href={`/panel/cursos/${course.slug}/examen/${m.id}`} className="btn-primary !py-1.5">
                    Rendir examen
                  </Link>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
