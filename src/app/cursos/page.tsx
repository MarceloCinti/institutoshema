import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/CatalogCards";
import type { Course } from "@/lib/types";

export const metadata = { title: "Cursos" };
export const revalidate = 60;

export default async function CursosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").eq("published", true).order("created_at", { ascending: false });
  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold">Cursos</h1>
      <p className="mt-2 text-gray-600">Clases online con asistencia registrada, exámenes por módulo y certificado final.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(data as Course[] | null)?.map((c) => <CourseCard key={c.id} course={c} />)}
        {!data?.length && <p className="text-gray-500">Todavía no hay cursos publicados.</p>}
      </div>
    </div>
  );
}
