import { createClient } from "@/lib/supabase/server";
import { BookCard } from "@/components/CatalogCards";
import Flash from "@/components/Flash";
import type { Book } from "@/lib/types";

export const metadata = { title: "Libros" };
export const revalidate = 60;

export default async function LibrosPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("*").eq("published", true).order("created_at", { ascending: false });
  return (
    <div className="container-page py-12">
      <Flash error={sp.error} />
      <h1 className="text-3xl font-bold">Libros</h1>
      <p className="mt-2 text-gray-600">Libros digitales del Pastor Félix Guerrero. Después del pago quedan disponibles en tu panel para descargar.</p>
      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {(data as Book[] | null)?.map((b) => <BookCard key={b.id} book={b} />)}
        {!data?.length && <p className="col-span-full text-gray-500">Todavía no hay libros publicados.</p>}
      </div>
    </div>
  );
}
