"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillOrder } from "@/lib/orders";
import { slugify } from "@/lib/format";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optional = (f: FormData, k: string) => str(f, k) || null;
const int = (f: FormData, k: string, def = 0) => {
  const n = parseInt(str(f, k).replace(/\./g, ""), 10);
  return Number.isFinite(n) ? n : def;
};

// ---------------------------------------------------------------- Pedidos

export async function approveOrder(formData: FormData) {
  await requireAdmin();
  await fulfillOrder(str(formData, "id"), optional(formData, "note") ?? undefined);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
}

export async function rejectOrder(formData: FormData) {
  await requireAdmin();
  await createAdminClient()
    .from("orders")
    .update({ status: "rejected", admin_note: optional(formData, "note") ?? "Comprobante no válido" })
    .eq("id", str(formData, "id"));
  revalidatePath("/admin/pedidos");
}

/** Habilita un libro o curso a un usuario sin pago (becas, cortesías, pagos en efectivo). */
export async function grantAccess(formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const email = str(formData, "email").toLowerCase();
  const [type, itemId] = str(formData, "item").split(":") as ["book" | "course", string];
  const amount = int(formData, "amount", 0);
  const back = str(formData, "back") || "/admin/pedidos";

  const { data: profile } = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (!profile) redirect(`${back}?error=${encodeURIComponent(`No existe un alumno registrado con ${email}`)}`);
  const { data: item } = await db.from(type === "book" ? "books" : "courses").select("id, title").eq("id", itemId).single();
  if (!item) redirect(`${back}?error=Producto inválido`);

  const { data: order } = await db
    .from("orders")
    .insert({
      user_id: profile.id,
      item_type: type,
      item_id: item.id,
      item_title: item.title,
      amount_pyg: amount,
      payment_method: amount ? "transferencia" : "cortesia",
      admin_note: optional(formData, "note") ?? "Acceso otorgado por administración",
    })
    .select("id")
    .single();
  await fulfillOrder(order!.id);
  revalidatePath(back);
  redirect(`${back}?ok=${encodeURIComponent(`Acceso a “${item.title}” otorgado a ${email}`)}`);
}

// ---------------------------------------------------------------- Libros

export async function createBook(formData: FormData) {
  await requireAdmin();
  const title = str(formData, "title");
  const { data, error } = await createAdminClient()
    .from("books")
    .insert({ title, slug: `${slugify(title)}-${Date.now().toString(36).slice(-4)}` })
    .select("id")
    .single();
  if (error) redirect(`/admin/libros?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/libros/${data.id}`);
}

export async function updateBook(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const filePath = optional(formData, "file_path");
  // Un libro sin archivo no se puede vender: se guarda, pero queda como borrador.
  const wantsPublished = formData.get("published") === "on";
  const blocked = wantsPublished && !filePath;
  const { error } = await createAdminClient()
    .from("books")
    .update({
      title: str(formData, "title"),
      slug: slugify(str(formData, "slug") || str(formData, "title")),
      subtitle: optional(formData, "subtitle"),
      author: str(formData, "author") || "Pastor Félix Guerrero",
      description: str(formData, "description"),
      price_pyg: int(formData, "price_pyg"),
      pages: int(formData, "pages") || null,
      cover_path: optional(formData, "cover_path"),
      file_path: filePath,
      published: wantsPublished && !blocked,
    })
    .eq("id", id);
  revalidatePath("/libros");
  revalidatePath("/");
  const msg = error
    ? `error=${encodeURIComponent(error.message)}`
    : blocked
      ? `error=${encodeURIComponent("Guardado como borrador: para publicar el libro primero subí el archivo (PDF o EPUB).")}`
      : "ok=Libro guardado";
  redirect(`/admin/libros/${id}?${msg}`);
}

export async function deleteBook(formData: FormData) {
  await requireAdmin();
  const { error } = await createAdminClient().from("books").delete().eq("id", str(formData, "id"));
  revalidatePath("/libros");
  redirect(`/admin/libros?${error ? `error=${encodeURIComponent(error.message)}` : "ok=Libro eliminado"}`);
}

// ---------------------------------------------------------------- Cursos

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const title = str(formData, "title");
  const { data, error } = await createAdminClient()
    .from("courses")
    .insert({ title, slug: `${slugify(title)}-${Date.now().toString(36).slice(-4)}` })
    .select("id")
    .single();
  if (error) redirect(`/admin/cursos?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/cursos/${data.id}`);
}

export async function updateCourse(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const { error } = await createAdminClient()
    .from("courses")
    .update({
      title: str(formData, "title"),
      slug: slugify(str(formData, "slug") || str(formData, "title")),
      subtitle: optional(formData, "subtitle"),
      teacher: str(formData, "teacher") || "Pastor Félix Guerrero",
      description: str(formData, "description"),
      price_pyg: int(formData, "price_pyg"),
      passing_score: Math.min(100, Math.max(1, int(formData, "passing_score", 70))),
      max_attempts: Math.max(1, int(formData, "max_attempts", 3)),
      cover_path: optional(formData, "cover_path"),
      published: formData.get("published") === "on",
    })
    .eq("id", id);
  revalidatePath("/cursos");
  revalidatePath("/");
  redirect(`/admin/cursos/${id}?${error ? `error=${encodeURIComponent(error.message)}` : "ok=Curso guardado"}`);
}

export async function deleteCourse(formData: FormData) {
  await requireAdmin();
  const { error } = await createAdminClient().from("courses").delete().eq("id", str(formData, "id"));
  revalidatePath("/cursos");
  redirect(`/admin/cursos?${error ? `error=${encodeURIComponent(error.message)}` : "ok=Curso eliminado"}`);
}

// ---------------------------------------------------------------- Módulos

export async function saveModule(formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const courseId = str(formData, "course_id");
  const id = str(formData, "id");
  const row = {
    title: str(formData, "title"),
    description: optional(formData, "description"),
    position: int(formData, "position", 1),
  };
  if (id) await db.from("modules").update(row).eq("id", id);
  else await db.from("modules").insert({ ...row, course_id: courseId });
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function deleteModule(formData: FormData) {
  await requireAdmin();
  const courseId = str(formData, "course_id");
  await createAdminClient().from("modules").delete().eq("id", str(formData, "id"));
  redirect(`/admin/cursos/${courseId}?ok=Módulo eliminado`);
}

// ---------------------------------------------------------------- Clases

export async function createLesson(formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const moduleId = str(formData, "module_id");
  const { data } = await db
    .from("lessons")
    .insert({
      module_id: moduleId,
      title: str(formData, "title"),
      position: int(formData, "position", 1),
      video_source: str(formData, "video_source") || "upload",
    })
    .select("id")
    .single();
  redirect(`/admin/clases/${data!.id}`);
}

export async function updateLesson(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const liveAt = str(formData, "live_at");
  const minutes = int(formData, "duration_minutes", 0);
  const seconds = minutes ? minutes * 60 : int(formData, "duration_seconds", 0);
  const { error } = await createAdminClient()
    .from("lessons")
    .update({
      title: str(formData, "title"),
      description: optional(formData, "description"),
      position: int(formData, "position", 1),
      video_source: str(formData, "video_source"),
      video_path: optional(formData, "video_path"),
      video_url: optional(formData, "video_url"),
      duration_seconds: seconds,
      // datetime-local llega sin zona horaria: se interpreta como hora de Paraguay
      live_at: liveAt ? new Date(`${liveAt}:00-03:00`).toISOString() : null,
      live_url: optional(formData, "live_url"),
      attendance_code: optional(formData, "attendance_code")?.toUpperCase() ?? null,
    })
    .eq("id", id);
  redirect(`/admin/clases/${id}?${error ? `error=${encodeURIComponent(error.message)}` : "ok=Clase guardada"}`);
}

export async function deleteLesson(formData: FormData) {
  await requireAdmin();
  const back = str(formData, "back");
  await createAdminClient().from("lessons").delete().eq("id", str(formData, "id"));
  redirect(`${back}?ok=Clase eliminada`);
}

/** Marca asistencia manualmente (por ejemplo, alumno presente en la clase presencial). */
export async function setAttendance(formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const userId = str(formData, "user_id");
  const lessonId = str(formData, "lesson_id");
  const attended = formData.get("attended") === "1";
  const now = new Date().toISOString();
  await db.from("lesson_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      attended,
      attended_at: attended ? now : null,
      attendance_method: attended ? "manual" : null,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id" },
  );
  revalidatePath(str(formData, "back"));
}

// ---------------------------------------------------------------- Exámenes

export async function saveQuestion(formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const moduleId = str(formData, "module_id");
  const options = [0, 1, 2, 3, 4, 5].map((i) => str(formData, `option_${i}`)).filter(Boolean);
  const correct = int(formData, "correct_index", 0);
  const back = str(formData, "back");
  if (options.length < 2) redirect(`${back}?error=La pregunta necesita al menos 2 opciones`);
  if (correct >= options.length) redirect(`${back}?error=Marcá cuál es la opción correcta`);
  const row = { question: str(formData, "question"), options, correct_index: correct, position: int(formData, "position", 1) };
  const id = str(formData, "id");
  if (id) await db.from("quiz_questions").update(row).eq("id", id);
  else await db.from("quiz_questions").insert({ ...row, module_id: moduleId });
  redirect(`${back}?ok=Pregunta guardada`);
}

export async function deleteQuestion(formData: FormData) {
  await requireAdmin();
  await createAdminClient().from("quiz_questions").delete().eq("id", str(formData, "id"));
  revalidatePath(str(formData, "back"));
}

export async function resetAttempts(formData: FormData) {
  await requireAdmin();
  await createAdminClient()
    .from("quiz_attempts")
    .delete()
    .eq("user_id", str(formData, "user_id"))
    .eq("module_id", str(formData, "module_id"))
    .eq("passed", false);
  revalidatePath(str(formData, "back"));
}

// ---------------------------------------------------------------- Usuarios

export async function setRole(formData: FormData) {
  const { user } = await requireAdmin();
  const id = str(formData, "id");
  if (id === user.id) return; // no quitarse el rol a sí mismo
  await createAdminClient()
    .from("profiles")
    .update({ role: str(formData, "role") === "admin" ? "admin" : "student" })
    .eq("id", id);
  revalidatePath(`/admin/alumnos/${id}`);
}
