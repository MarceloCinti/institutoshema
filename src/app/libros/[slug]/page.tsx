import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { userOwns } from "@/lib/orders";
import { formatPYG } from "@/lib/format";
import Cover from "@/components/Cover";
import type { Book } from "@/lib/types";

export default async function LibroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: book } = await supabase.from("books").select("*").eq("slug", slug).eq("published", true).maybeSingle<Book>();
  if (!book) notFound();
  const { user } = await getSession();
  const owned = user ? await userOwns(user.id, "book", book.id) : false;

  return (
    <div className="container-page grid gap-10 py-12 md:grid-cols-3">
      <div className="mx-auto w-full max-w-xs">
        <Cover path={book.cover_path} title={book.title} />
      </div>
      <div className="md:col-span-2">
        <p className="text-sm uppercase tracking-widest text-gold-700">Libro digital</p>
        <h1 className="mt-1 text-3xl font-bold">{book.title}</h1>
        {book.subtitle && <p className="mt-1 text-lg text-gray-600">{book.subtitle}</p>}
        <p className="mt-2 text-sm text-gray-500">
          {book.author}
          {book.pages ? ` · ${book.pages} páginas` : ""}
        </p>
        <p className="mt-6 text-2xl font-bold text-navy-900">{book.price_pyg ? formatPYG(book.price_pyg) : "Gratuito"}</p>
        {owned ? (
          <Link href="/panel/libros" className="btn-primary mt-4">Ya es tuyo — ir a Mis libros</Link>
        ) : (
          <Link href={`/comprar/libro/${book.id}`} className="btn-gold mt-4">Comprar libro</Link>
        )}
        <div className="mt-8 whitespace-pre-line leading-relaxed text-gray-700">{book.description}</div>
      </div>
    </div>
  );
}
