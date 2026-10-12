import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDuration } from "@/lib/format";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { createLesson, deleteModule, deleteQuestion, saveModule, saveQuestion } from "../../../../actions";
import { requireAdmin } from "@/lib/auth";

const SOURCE: Record<string, string> = { upload: "Video subido", youtube: "YouTube", live: "En vivo" };

type Question = { id: string; question: string; options: string[]; correct_index: number; position: number };

function QuestionFields({ q, n }: { q?: Question; n: number }) {
  const opts = q?.options ?? [];
  return (
    <>
      <div className="flex gap-2">
        <input name="position" className="input w-16" defaultValue={q?.position ?? n} inputMode="numeric" />
        <input name="question" className="input" defaultValue={q?.question} placeholder="Pregunta" required />
      </div>
      <p className="text-xs text-gray-500">Opciones (marcá la correcta). Dejá vacías las que no uses.</p>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <label key={i} className="flex items-center gap-2">
          <input type="radio" name="correct_index" value={i} defaultChecked={(q?.correct_index ?? 0) === i} />
          <input name={`option_${i}`} className="input !py-1.5" defaultValue={opts[i] ?? ""} placeholder={`Opción ${i + 1}`} />
        </label>
      ))}
    </>
  );
}

export default async function ModuloAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; moduleId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  await requireAdmin();
  const { id, moduleId } = await params;
  const sp = await searchParams;
  const db = createAdminClient();
  const [{ data: mod }, { data: lessons }, { data: questions }] = await Promise.all([
    db.from("modules").select("*, courses(title)").eq("id", moduleId).eq("course_id", id).maybeSingle(),
    db.from("lessons").select("id, title, position, video_source, video_path, video_url, duration_seconds, attendance_code").eq("module_id", moduleId).order("position"),
    db.from("quiz_questions").select("*").eq("module_id", moduleId).order("position"),
  ]);
  if (!mod) notFound();
  const back = `/admin/cursos/${id}/modulos/${moduleId}`;
  const qs = (questions ?? []) as Question[];

  return (
    <div className="space-y-6">
      <Link href={`/admin/cursos/${id}`} className="text-sm text-gold-700 hover:underline">
        ← {(mod.courses as unknown as { title: string }).title}
      </Link>
      <h1 className="text-2xl font-bold">Módulo {mod.position}: {mod.title}</h1>
      <Flash ok={sp.ok} error={sp.error} />

      <section className="card">
        <h2 className="mb-4 text-lg font-bold">Clases</h2>
        <ul className="divide-y divide-gray-100">
          {(lessons ?? []).map((l) => {
            const missing = l.video_source === "upload" ? !l.video_path : l.video_source === "youtube" ? !l.video_url : !l.attendance_code;
            return (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link href={`/admin/clases/${l.id}`} className="font-medium hover:text-gold-700">
                  {l.position}. {l.title}
                </Link>
                <span className="flex items-center gap-2 text-xs text-gray-500">
                  {SOURCE[l.video_source]} {formatDuration(l.duration_seconds)}
                  {missing && (
                    <span className="badge bg-amber-100 text-amber-800">
                      {l.video_source === "live" ? "Falta código de asistencia" : "Falta video"}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <form action={createLesson} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="module_id" value={moduleId} />
          <div className="w-16">
            <label className="label">N°</label>
            <input name="position" className="input" defaultValue={(lessons?.length ?? 0) + 1} inputMode="numeric" />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="label">Nueva clase</label>
            <input name="title" className="input" placeholder="Título de la clase" required />
          </div>
          <select name="video_source" className="input w-auto">
            <option value="upload">Video subido</option>
            <option value="youtube">YouTube (no listado)</option>
            <option value="live">Clase en vivo</option>
          </select>
          <SubmitButton className="btn-gold">Agregar clase</SubmitButton>
        </form>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-bold">Examen del módulo</h2>
          <p className="text-sm text-gray-500">
            El alumno lo rinde después de tener asistencia en todas las clases del módulo. Si no hay preguntas, el módulo se
            aprueba sólo con la asistencia.
          </p>
        </div>
        {qs.map((q, i) => (
          <details key={q.id} className="rounded-lg border border-gray-200 p-3">
            <summary className="cursor-pointer text-sm">
              <strong>{i + 1}.</strong> {q.question}{" "}
              <span className="text-emerald-700">✓ {q.options[q.correct_index]}</span>
            </summary>
            <form action={saveQuestion} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={q.id} />
              <input type="hidden" name="module_id" value={moduleId} />
              <input type="hidden" name="back" value={back} />
              <QuestionFields q={q} n={i + 1} />
              <SubmitButton className="btn-primary !py-1.5">Guardar</SubmitButton>
            </form>
            <form action={deleteQuestion} className="mt-2">
              <input type="hidden" name="id" value={q.id} />
              <input type="hidden" name="back" value={back} />
              <SubmitButton className="btn-danger !py-1 text-xs" confirm="¿Eliminar la pregunta?">Eliminar pregunta</SubmitButton>
            </form>
          </details>
        ))}
        <form action={saveQuestion} className="space-y-2 rounded-lg bg-navy-50 p-4">
          <p className="font-semibold">Nueva pregunta</p>
          <input type="hidden" name="module_id" value={moduleId} />
          <input type="hidden" name="back" value={back} />
          <QuestionFields n={qs.length + 1} />
          <SubmitButton className="btn-gold !py-1.5">Agregar pregunta</SubmitButton>
        </form>
      </section>

      <form action={saveModule} className="card space-y-3">
        <h2 className="text-lg font-bold">Datos del módulo</h2>
        <input type="hidden" name="id" value={mod.id} />
        <input type="hidden" name="course_id" value={id} />
        <div className="flex gap-2">
          <input name="position" className="input w-20" defaultValue={mod.position} inputMode="numeric" />
          <input name="title" className="input" defaultValue={mod.title} required />
        </div>
        <textarea name="description" className="input" rows={3} defaultValue={mod.description ?? ""} placeholder="Descripción (opcional)" />
        <SubmitButton>Guardar módulo</SubmitButton>
      </form>
      <form action={deleteModule}>
        <input type="hidden" name="id" value={mod.id} />
        <input type="hidden" name="course_id" value={id} />
        <SubmitButton className="btn-danger" confirm="¿Eliminar el módulo con sus clases y examen?">Eliminar módulo</SubmitButton>
      </form>
    </div>
  );
}
