import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentCourseState } from "@/lib/academic";
import { setAttendance } from "../../../actions";
import type { Course } from "@/lib/types";

export const metadata = { title: "Asistencia" };
export const dynamic = "force-dynamic";

const METHOD: Record<string, string> = { video: "Video", codigo: "Código en vivo", manual: "Manual" };

export default async function AsistenciaCurso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createAdminClient();
  const { data: course } = await db.from("courses").select("*").eq("id", id).maybeSingle<Course>();
  if (!course) notFound();
  const { data: enr } = await db.from("enrollments").select("user_id, profiles(full_name, email)").eq("course_id", id);
  const students = (enr ?? []).map((e) => ({ id: e.user_id, ...(e.profiles as unknown as { full_name: string; email: string }) }));
  const states = await Promise.all(students.map((s) => getStudentCourseState(s.id, course)));

  const lessonIds = states[0]?.modules.flatMap((m) => m.lessons.map((l) => l.id)) ?? [];
  const { data: progress } = lessonIds.length
    ? await db.from("lesson_progress").select("user_id, lesson_id, attendance_method, presence_checks, attended").in("lesson_id", lessonIds)
    : { data: [] };
  const back = `/admin/cursos/${id}/asistencia`;
  const modules = states[0]?.modules ?? [];

  return (
    <div className="space-y-4">
      <Link href={`/admin/cursos/${id}`} className="text-sm text-gold-700 hover:underline">← {course.title}</Link>
      <h1 className="text-2xl font-bold">Asistencia y notas</h1>
      <p className="text-sm text-gray-600">
        ✓ = asistencia registrada (pasá el mouse para ver cómo). Hacé clic en una celda para marcar o quitar la asistencia
        manualmente.
      </p>
      {!students.length ? (
        <p className="card text-gray-600">Todavía no hay alumnos inscriptos.</p>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white">Alumno</th>
                <th>Avance</th>
                {modules.map((m, mi) => (
                  <th key={m.id} colSpan={m.lessons.length + (m.questionCount ? 1 : 0)} className="border-l text-center">
                    Módulo {mi + 1}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 bg-white" />
                <th />
                {modules.map((m) => (
                  <Fragment key={m.id}>
                    {m.lessons.map((l, li) => (
                      <th key={l.id} title={l.title} className="text-center font-normal">C{li + 1}</th>
                    ))}
                    {m.questionCount > 0 && <th className="text-center font-normal">Examen</th>}
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, si) => {
                const st = states[si];
                return (
                  <tr key={s.id}>
                    <td className="sticky left-0 bg-white">
                      <Link href={`/admin/alumnos/${s.id}`} className="font-medium hover:text-gold-700">{s.full_name || s.email}</Link>
                      {st.certificate && <span className="ml-1" title="Certificado emitido">🎓</span>}
                    </td>
                    <td>{st.percent}%</td>
                    {st.modules.map((m) => (
                      <Fragment key={m.id}>
                        {m.lessons.map((l) => {
                          const p = progress?.find((x) => x.user_id === s.id && x.lesson_id === l.id);
                          return (
                            <td key={l.id} className="text-center">
                              <form action={setAttendance}>
                                <input type="hidden" name="user_id" value={s.id} />
                                <input type="hidden" name="lesson_id" value={l.id} />
                                <input type="hidden" name="attended" value={l.attended ? "0" : "1"} />
                                <input type="hidden" name="back" value={back} />
                                <button
                                  title={
                                    l.attended
                                      ? `${METHOD[p?.attendance_method ?? ""] ?? ""}${p?.presence_checks ? ` · ${p.presence_checks} controles de presencia` : ""}`
                                      : `${Math.round((l.watched_seconds || 0) / 60)} min vistos`
                                  }
                                  className={`h-6 w-6 rounded ${l.attended ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}
                                >
                                  {l.attended ? "✓" : "·"}
                                </button>
                              </form>
                            </td>
                          );
                        })}
                        {m.questionCount > 0 && (
                          <td className={`text-center ${m.passed ? "text-emerald-700" : "text-gray-500"}`}>
                            {m.bestScore !== null ? `${m.bestScore}%` : "—"}
                            <span className="block text-[10px] text-gray-400">{m.attempts} int.</span>
                          </td>
                        )}
                      </Fragment>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
