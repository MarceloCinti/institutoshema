import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMyCourses } from "@/lib/student";
import ProgressBar from "@/components/ProgressBar";
import Flash from "@/components/Flash";

export const metadata = { title: "Mi panel" };

export default async function PanelHome({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { user, profile } = await requireUser();
  const db = createAdminClient();
  const [courses, { count: books }, { count: pending }, { count: certs }] = await Promise.all([
    getMyCourses(user.id),
    db.from("book_purchases").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    db.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["pending", "review"]),
    db.from("certificates").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const stats = [
    { label: "Cursos", value: courses.length, href: "/panel/cursos" },
    { label: "Libros", value: books ?? 0, href: "/panel/libros" },
    { label: "Pagos pendientes", value: pending ?? 0, href: "/panel/compras" },
    { label: "Certificados", value: certs ?? 0, href: "/panel/certificados" },
  ];

  return (
    <div>
      <Flash ok={sp.ok} />
      <h1 className="text-2xl font-bold">Shalom, {profile.full_name.split(" ")[0] || "alumno"} 👋</h1>
      <p className="text-gray-600">Este es tu campus del Instituto Shema.</p>

      {!profile.document_number && (
        <p className="alert-error mt-4">
          Completá tu número de cédula en <Link href="/panel/perfil" className="underline">Mi perfil</Link> para que figure en tus certificados.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card !p-4 hover:shadow-md">
            <p className="text-3xl font-bold text-navy-900">{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">Mi avance</h2>
      <div className="mt-4 space-y-4">
        {courses.map(({ course, state }) => (
          <Link key={course.id} href={`/panel/cursos/${course.slug}`} className="card block !p-5 hover:shadow-md">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-navy-900">{course.title}</p>
              {state.certificate && <span className="badge bg-gold-100 text-gold-700">Certificado</span>}
            </div>
            <p className="mb-3 text-xs text-gray-500">
              {state.attendedLessons} de {state.totalLessons} clases con asistencia ·{" "}
              {state.modules.filter((m) => m.passed).length} de {state.modules.length} módulos aprobados
            </p>
            <ProgressBar value={state.percent} label="Progreso" />
          </Link>
        ))}
        {!courses.length && (
          <div className="card text-center">
            <p className="text-gray-600">Todavía no estás inscripto en ningún curso.</p>
            <Link href="/cursos" className="btn-gold mt-4">Ver cursos disponibles</Link>
          </div>
        )}
      </div>
    </div>
  );
}
