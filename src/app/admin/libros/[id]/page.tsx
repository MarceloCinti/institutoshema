import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import Flash from "@/components/Flash";
import FileUpload from "@/components/FileUpload";
import SubmitButton from "@/components/SubmitButton";
import Cover from "@/components/Cover";
import { deleteBook, updateBook } from "../../actions";
import type { Book } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export default async function EditarLibro({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const { data: book } = await createAdminClient().from("books").select("*").eq("id", id).maybeSingle<Book>();
  if (!book) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/libros" className="text-sm text-gold-700 hover:underline">← Libros</Link>
      <h1 className="text-2xl font-bold">{book.title}</h1>
      <Flash ok={sp.ok} error={sp.error} />
      <form action={updateBook} className="card space-y-4">
        <input type="hidden" name="id" value={book.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Título</label>
            <input name="title" className="input" defaultValue={book.title} required />
          </div>
          <div>
            <label className="label">Subtítulo</label>
            <input name="subtitle" className="input" defaultValue={book.subtitle ?? ""} />
          </div>
          <div>
            <label className="label">Autor</label>
            <input name="author" className="input" defaultValue={book.author} />
          </div>
          <div>
            <label className="label">Precio (Gs.)</label>
            <input name="price_pyg" className="input" inputMode="numeric" defaultValue={book.price_pyg} />
          </div>
          <div>
            <label className="label">Páginas</label>
            <input name="pages" className="input" inputMode="numeric" defaultValue={book.pages ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Dirección web (slug)</label>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              /libros/<input name="slug" className="input" defaultValue={book.slug} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción</label>
            <textarea name="description" rows={6} className="input" defaultValue={book.description} />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-[120px_1fr]">
          <Cover path={book.cover_path} title={book.title} />
          <div className="space-y-5">
            <FileUpload bucket="covers" folder="libros" name="cover_path" accept="image/*" label="Portada (JPG/PNG, vertical)" initialPath={book.cover_path} />
            <FileUpload bucket="books" folder="libros" name="file_path" accept=".pdf,.epub,application/pdf,application/epub+zip" label="Archivo del libro (PDF o EPUB) — privado, sólo para compradores" initialPath={book.file_path} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={book.published} /> Publicado (visible en la tienda)
        </label>
        <SubmitButton>Guardar libro</SubmitButton>
      </form>
      <form action={deleteBook}>
        <input type="hidden" name="id" value={book.id} />
        <SubmitButton className="btn-danger" confirm="¿Eliminar el libro? Los compradores perderán el acceso.">Eliminar libro</SubmitButton>
      </form>
    </div>
  );
}
