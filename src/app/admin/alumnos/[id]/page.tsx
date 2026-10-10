import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMyCourses } from "@/lib/student";
import { formatDate, formatPYG, ORDER_STATUS } from "@/lib/format";
import ProgressBar from "@/components/ProgressBar";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import GrantAccessForm from "@/components/GrantAccessForm";
import { resetAttempts, setRole } from "../../actions";
import type { Order, Profile } from "@/lib/types";

export default async function AlumnoAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { user } = await requireAdmin();
  const db = createAdminClient();
  const { data: p } = await db.from("profiles").select("*").eq("id", id).maybeSingle<Profile>();
  if (!p) notFound();
  const [courses, { data: orders }, { data: books }] = await Promise.all([
    getMyCourses(id),
    db.from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    db.from("book_purchases").select("books(title)").eq("user_id", id),
  ]);
  const back = `/admin/alumnos/${id}`;

  return (
    <div className="space-y-6">
      <Link href="/admin/alumnos" className="text-sm text-gold-700 hover:underline">← Alumnos</Link>
      <h1 className="text-2xl font-bold">{p.full_name || p.email}</h1>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="card grid gap-2 text-sm sm:grid-cols-2">
        <p><strong>Correo:</strong> {p.email}</p>
        <p><strong>Celular:</strong> {p.phone ?? "—"}</p>
        <p><strong>C.I.:</strong> {p.document_number ?? "—"}</p>
        <p><strong>Ciudad:</strong> {p.city ?? "—"}</p>
        <p><strong>Registrado:</strong> {formatDate(p.created_at)}</p>
        <div className="flex items-center gap-2">
          <strong>Rol:</strong> {p.role === "admin" ? "Administrador" : "Alumno"}
          {p.id !== user.id && (
            <form action={setRole}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="role" value={p.role === "admin" ? "student" : "admin"} />
              <SubmitButton className="text-xs text-gold-700 underline" confirm="¿Cambiar el rol de este usuario?">
                {p.role === "admin" ? "Quitar admin" : "Hacer administrador"}
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Cursos</h2>
        <div className="space-y-3">
          {courses.map(({ course, state }) => (
            <div key={course.id} className="card !p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{course.title}</p>
                {state.certificate && (
                  <a href={`/api/certificados/${state.certificate.code}`} className="text-xs text-gold-700 underline">
                    Certificado {state.certificate.code}
                  </a>
                )}
              </div>
              <ProgressBar value={state.percent} label={`${state.attendedLessons}/${state.totalLessons} clases`} />
              <ul className="mt-3 space-y-1 text-xs">
                {state.modules
                  .filter((m) => m.questionCount > 0)
                  .map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <span>
                        {m.title}: {m.bestScore !== null ? `${m.bestScore}%` : "sin rendir"} ({m.attempts} intentos)
                        {m.passed && " ✓"}
                      </span>
                      {!m.passed && m.attempts > 0 && (
                        <form action={resetAttempts}>
                          <input type="hidden" name="user_id" value={id} />
                          <input type="hidden" name="module_id" value={m.id} />
                          <input type="hidden" name="back" value={back} />
                          <SubmitButton className="text-gold-700 underline" confirm="¿Habilitar nuevos intentos?">
                            Reiniciar intentos
                          </SubmitButton>
                        </form>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          {!courses.length && <p className="text-sm text-gray-500">Sin cursos.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Libros</h2>
        <p className="text-sm">{(books ?? []).map((b) => (b.books as unknown as { title: string }).title).join(", ") || "Sin libros."}</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Pedidos</h2>
        <div className="card overflow-x-auto !p-0">
          <table className="table">
            <tbody>
              {((orders ?? []) as Order[]).map((o) => (
                <tr key={o.id}>
                  <td>{formatDate(o.created_at)}</td>
                  <td>{o.item_title}</td>
                  <td>{formatPYG(o.amount_pyg)}</td>
                  <td><span className={`badge ${ORDER_STATUS[o.status].className}`}>{ORDER_STATUS[o.status].label}</span></td>
                </tr>
              ))}
              {!orders?.length && <tr><td className="text-gray-500">Sin pedidos.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <GrantAccessForm back={back} email={p.email ?? undefined} />
    </div>
  );
}
