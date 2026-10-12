import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Alumnos" };
export const dynamic = "force-dynamic";

export default async function AlumnosAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const db = createAdminClient();
  let query = db.from("profiles").select("*").order("created_at", { ascending: false }).limit(300);
  if (q) {
    const term = q.replace(/[%,()]/g, " ").trim();
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,document_number.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const [{ data }, { data: enr }, { data: books }] = await Promise.all([
    query,
    db.from("enrollments").select("user_id"),
    db.from("book_purchases").select("user_id"),
  ]);
  const people = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alumnos</h1>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} className="input" placeholder="Buscar por nombre, correo, cédula o teléfono" />
        <button className="btn-primary">Buscar</button>
      </form>
      <div className="card overflow-x-auto !p-0">
        <table className="table">
          <thead>
            <tr><th>Nombre</th><th>Contacto</th><th>C.I.</th><th>Cursos</th><th>Libros</th><th>Registro</th></tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/alumnos/${p.id}`} className="font-medium hover:text-gold-700">{p.full_name || "—"}</Link>
                  {p.role === "admin" && <span className="badge ml-2 bg-gold-100 text-gold-700">Admin</span>}
                </td>
                <td className="text-xs">{p.email}<br />{p.phone}</td>
                <td>{p.document_number}</td>
                <td>{(enr ?? []).filter((e) => e.user_id === p.id).length}</td>
                <td>{(books ?? []).filter((b) => b.user_id === p.id).length}</td>
                <td className="whitespace-nowrap text-xs">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
