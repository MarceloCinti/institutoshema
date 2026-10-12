import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPYG } from "@/lib/format";
import Cover from "@/components/Cover";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { createCourse } from "../actions";
import type { Course } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Cursos" };
export const dynamic = "force-dynamic";

export default async function CursosAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = createAdminClient();
  const [{ data }, { data: enr }] = await Promise.all([
    db.from("courses").select("*").order("created_at"),
    db.from("enrollments").select("course_id"),
  ]);
  const courses = (data ?? []) as Course[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cursos y clases</h1>
      <Flash ok={sp.ok} error={sp.error} />
      <form action={createCourse} className="card flex flex-wrap items-end gap-3 !p-4">
        <div className="flex-1">
          <label className="label" htmlFor="title">Nuevo curso</label>
          <input id="title" name="title" className="input" placeholder="Nombre del curso" required />
        </div>
        <SubmitButton className="btn-gold">Crear curso</SubmitButton>
      </form>
      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((c) => (
          <Link key={c.id} href={`/admin/cursos/${c.id}`} className="card flex gap-4 !p-4 hover:shadow-md">
            <div className="w-32 shrink-0"><Cover path={c.cover_path} title={c.title} aspect="aspect-video" /></div>
            <div>
              <p className="font-semibold text-navy-900">{c.title}</p>
              <p className="text-sm">{formatPYG(c.price_pyg)}</p>
              <p className="text-xs text-gray-500">{(enr ?? []).filter((e) => e.course_id === c.id).length} alumnos inscriptos</p>
              <span className={`badge mt-2 ${c.published ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                {c.published ? "Publicado" : "Borrador"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
