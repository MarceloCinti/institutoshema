import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPYG } from "@/lib/format";
import Cover from "@/components/Cover";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { createBook } from "../actions";
import type { Book } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Libros" };
export const dynamic = "force-dynamic";

export default async function LibrosAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const db = createAdminClient();
  const [{ data }, { data: sales }] = await Promise.all([
    db.from("books").select("*").order("created_at"),
    db.from("book_purchases").select("book_id"),
  ]);
  const books = (data ?? []) as Book[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Libros</h1>
      <Flash ok={sp.ok} error={sp.error} />
      <form action={createBook} className="card flex flex-wrap items-end gap-3 !p-4">
        <div className="flex-1">
          <label className="label" htmlFor="title">Nuevo libro</label>
          <input id="title" name="title" className="input" placeholder="Título del libro" required />
        </div>
        <SubmitButton className="btn-gold">Crear libro</SubmitButton>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b) => (
          <Link key={b.id} href={`/admin/libros/${b.id}`} className="card flex gap-4 !p-4 hover:shadow-md">
            <div className="w-20 shrink-0"><Cover path={b.cover_path} title={b.title} /></div>
            <div className="min-w-0">
              <p className="font-semibold text-navy-900">{b.title}</p>
              <p className="text-sm">{formatPYG(b.price_pyg)}</p>
              <p className="text-xs text-gray-500">{(sales ?? []).filter((s) => s.book_id === b.id).length} vendidos</p>
              <span className={`badge mt-2 ${b.published ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                {b.published ? "Publicado" : "Borrador"}
              </span>
              {!b.file_path && <span className="badge ml-1 mt-2 bg-amber-100 text-amber-800">Falta archivo</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
