import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import Flash from "@/components/Flash";
import FileUpload from "@/components/FileUpload";
import SubmitButton from "@/components/SubmitButton";
import { deleteLesson, updateLesson } from "../../actions";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  // Paraguay: UTC-3 todo el año
  return new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 16);
}

export default async function EditarClase({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { lessonId } = await params;
  const sp = await searchParams;
  const { data: l } = await createAdminClient()
    .from("lessons")
    .select("*, modules(id, title, course_id)")
    .eq("id", lessonId)
    .maybeSingle();
  if (!l) notFound();
  const mod = l.modules as unknown as { id: string; title: string; course_id: string };
  const back = `/admin/cursos/${mod.course_id}/modulos/${mod.id}`;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href={back} className="text-sm text-gold-700 hover:underline">← {mod.title}</Link>
      <h1 className="text-2xl font-bold">{l.title}</h1>
      <Flash ok={sp.ok} error={sp.error} />

      <form action={updateLesson} className="card space-y-5">
        <input type="hidden" name="id" value={l.id} />
        <div className="flex gap-2">
          <div className="w-20">
            <label className="label">N°</label>
            <input name="position" className="input" defaultValue={l.position} inputMode="numeric" />
          </div>
          <div className="flex-1">
            <label className="label">Título</label>
            <input name="title" className="input" defaultValue={l.title} required />
          </div>
        </div>
        <div>
          <label className="label">Descripción / material de la clase</label>
          <textarea name="description" rows={4} className="input" defaultValue={l.description ?? ""} />
        </div>
        <div>
          <label className="label">Tipo de clase</label>
          <select name="video_source" className="input" defaultValue={l.video_source}>
            <option value="upload">Video subido a la plataforma</option>
            <option value="youtube">Video de YouTube (no listado)</option>
            <option value="live">Clase en vivo (Zoom / Meet / YouTube Live)</option>
          </select>
        </div>

        <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4">
          <legend className="px-1 text-sm font-semibold">Video</legend>
          <FileUpload
            bucket="videos"
            folder={`clases/${l.id}`}
            name="video_path"
            accept="video/mp4,video/webm,video/quicktime"
            label="Subir video (MP4 recomendado). Es privado: sólo lo ven los alumnos inscriptos."
            initialPath={l.video_path}
            durationInputName="duration_seconds"
          />
          <div>
            <label className="label">…o enlace de YouTube (si no subís el video)</label>
            <input name="video_url" className="input" defaultValue={l.video_url ?? ""} placeholder="https://youtu.be/..." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Duración (segundos)</label>
              <input name="duration_seconds" className="input" inputMode="numeric" defaultValue={l.duration_seconds || ""} />
            </div>
            <div>
              <label className="label">…o en minutos</label>
              <input name="duration_minutes" className="input" inputMode="numeric" placeholder="ej. 45" />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            La duración se completa sola al subir un video. Para YouTube indicala manualmente: se usa para calcular la
            asistencia (el alumno debe reproducir el 90%).
          </p>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4">
          <legend className="px-1 text-sm font-semibold">Clase en vivo</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Fecha y hora (Paraguay)</label>
              <input type="datetime-local" name="live_at" className="input" defaultValue={toLocalInput(l.live_at)} />
            </div>
            <div>
              <label className="label">Enlace de la transmisión</label>
              <input name="live_url" className="input" defaultValue={l.live_url ?? ""} placeholder="https://zoom.us/j/..." />
            </div>
          </div>
          <div>
            <label className="label">Código de asistencia</label>
            <input name="attendance_code" className="input uppercase" defaultValue={l.attendance_code ?? ""} placeholder="ej. SHALOM24" />
            <p className="mt-1 text-xs text-gray-500">
              Decilo durante la clase en vivo: los alumnos lo ingresan en la plataforma para registrar su presencia. Después
              podés subir la grabación arriba para quienes no pudieron asistir.
            </p>
          </div>
        </fieldset>

        <SubmitButton>Guardar clase</SubmitButton>
      </form>

      <form action={deleteLesson}>
        <input type="hidden" name="id" value={l.id} />
        <input type="hidden" name="back" value={back} />
        <SubmitButton className="btn-danger" confirm="¿Eliminar esta clase?">Eliminar clase</SubmitButton>
      </form>
    </div>
  );
}
