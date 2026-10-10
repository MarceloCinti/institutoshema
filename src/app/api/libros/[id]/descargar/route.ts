import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userOwns } from "@/lib/orders";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await getSession();
  if (!user) return NextResponse.redirect(new URL("/ingresar", request.url));
  if (profile?.role !== "admin" && !(await userOwns(user.id, "book", id))) {
    return NextResponse.json({ error: "No compraste este libro" }, { status: 403 });
  }
  const db = createAdminClient();
  const { data: book } = await db.from("books").select("slug, file_path").eq("id", id).single();
  if (!book?.file_path) return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  const ext = book.file_path.split(".").pop();
  const { data } = await db.storage.from("books").createSignedUrl(book.file_path, 120, { download: `${book.slug}.${ext}` });
  if (!data) return NextResponse.json({ error: "No se pudo generar el enlace" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
