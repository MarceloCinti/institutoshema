import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseOutline } from "@/lib/academic";
import Flash from "@/components/Flash";
import FileUpload from "@/components/FileUpload";
import SubmitButton from "@/components/SubmitButton";
import Cover from "@/components/Cover";
import { deleteCourse, saveModule, updateCourse } from "../../actions";
import type { Course } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export default async function EditarCurso({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const { data: course } = await createAdminClient().from("courses").select("*").eq("id", id).maybeSingle<Course>();
  if (!course) notFound();
  const outline = await getCourseOutline(course.id);

  return (
    <div className="space-y-6">
      <Link href="/admin/cursos" className="text-sm text-gold-700 hover:underline">← Cursos</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <div className="flex gap-2">
          <Link href={`/admin/cursos/${course.id}/asistencia`} className="btn-outline !py-2">Asistencia y notas</Link>
          <Link href={`/panel/cursos/${course.slug}`} className="btn-outline !py-2">Ver como alumno</Link>
        </div>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <section className="card">
        <h2 className="mb-4 text-lg font-bold">Módulos</h2>
        <ol className="space-y-3">
          {outline.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
              <div>
                <p className="font-semibold">{m.position}. {m.title}</p>
                <p className="text-xs text-gray-500">{m.lessons.length} clases · {m.questionCount} preguntas de examen</p>
              </div>
              <Link href={`/admin/cursos/${course.id}/modulos/${m.id}`} className="btn-primary !py-1.5">Clases y examen →</Link>
            </li>
          ))}
        </ol>
        <form action={saveModule} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="course_id" value={course.id} />
          <div className="w-20">
            <label className="label">N°</label>
            <input name="position" className="input" defaultValue={outline.length + 1} inputMode="numeric" />
          </div>
          <div className="flex-1">
            <label className="label">Nuevo módulo</label>
            <input name="title" className="input" placeholder="Título del módulo" required />
          </div>
          <SubmitButton className="btn-gold">Agregar módulo</SubmitButton>
        </form>
      </section>

      <form action={updateCourse} className="card space-y-4">
        <h2 className="text-lg font-bold">Datos del curso</h2>
        <input type="hidden" name="id" value={course.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Título</label>
            <input name="title" className="input" defaultValue={course.title} required />
          </div>
          <div>
            <label className="label">Subtítulo</label>
            <input name="subtitle" className="input" defaultValue={course.subtitle ?? ""} />
          </div>
          <div>
            <label className="label">Profesor</label>
            <input name="teacher" className="input" defaultValue={course.teacher} />
          </div>
          <div>
            <label className="label">Precio (Gs.) — 0 = gratuito</label>
            <input name="price_pyg" className="input" inputMode="numeric" defaultValue={course.price_pyg} />
          </div>
          <div>
            <label className="label">Dirección web (slug)</label>
            <input name="slug" className="input" defaultValue={course.slug} />
          </div>
          <div>
            <label className="label">Nota mínima para aprobar (%)</label>
            <input name="passing_score" className="input" inputMode="numeric" defaultValue={course.passing_score} />
          </div>
          <div>
            <label className="label">Intentos por examen</label>
            <input name="max_attempts" className="input" inputMode="numeric" defaultValue={course.max_attempts} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción</label>
            <textarea name="description" rows={6} className="input" defaultValue={course.description} />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
          <Cover path={course.cover_path} title={course.title} aspect="aspect-video" />
          <FileUpload bucket="covers" folder="cursos" name="cover_path" accept="image/*" label="Imagen del curso (horizontal 16:9)" initialPath={course.cover_path} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={course.published} /> Publicado (visible y a la venta)
        </label>
        <SubmitButton>Guardar curso</SubmitButton>
      </form>

      <form action={deleteCourse}>
        <input type="hidden" name="id" value={course.id} />
        <SubmitButton className="btn-danger" confirm="¿Eliminar el curso con todos sus módulos, clases, avances y certificados?">
          Eliminar curso
        </SubmitButton>
      </form>
    </div>
  );
}
