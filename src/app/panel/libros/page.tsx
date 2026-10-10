import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import Cover from "@/components/Cover";
import type { Book } from "@/lib/types";

export const metadata = { title: "Mis libros" };

export default async function MisLibros() {
  const { user } = await requireUser();
  const { data } = await createAdminClient()
    .from("book_purchases")
    .select("created_at, books(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const books = (data ?? []).map((p) => p.books as unknown as Book).filter(Boolean);

  return (
    <div>
      <h1 className="text-2xl font-bold">Mis libros</h1>
      <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3">
        {books.map((b) => (
          <div key={b.id} className="card flex flex-col gap-3 !p-4">
            <Cover path={b.cover_path} title={b.title} />
            <p className="font-semibold text-navy-900">{b.title}</p>
            {b.file_path ? (
              <a href={`/api/libros/${b.id}/descargar`} className="btn-gold mt-auto">Descargar</a>
            ) : (
              <p className="mt-auto text-xs text-gray-500">El archivo estará disponible muy pronto.</p>
            )}
          </div>
        ))}
      </div>
      {!books.length && (
        <p className="mt-6 text-gray-600">
          Todavía no compraste libros. <Link href="/libros" className="text-gold-700 underline">Ver libros</Link>
        </p>
      )}
      <p className="mt-8 text-xs text-gray-500">
        Los libros son para uso personal. Por favor no los compartas: tu compra sostiene el ministerio.
      </p>
    </div>
  );
}
