"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillOrder, userOwns } from "@/lib/orders";
import { iniciarTransaccion, pagoparEnabled } from "@/lib/pagopar";
import { coverUrl } from "@/lib/format";

type ItemType = "book" | "course";

async function loadItem(type: ItemType, id: string) {
  const db = createAdminClient();
  const { data } = await db
    .from(type === "book" ? "books" : "courses")
    .select("id, title, slug, price_pyg, cover_path, published")
    .eq("id", id)
    .maybeSingle();
  if (!data || !data.published) throw new Error("Producto no disponible");
  return data as { id: string; title: string; slug: string; price_pyg: number; cover_path: string | null };
}

export async function checkout(formData: FormData) {
  const { user, profile } = await requireUser();
  const type = formData.get("item_type") === "book" ? "book" : "course";
  const itemId = String(formData.get("item_id"));
  const method = String(formData.get("method")) as "pagopar" | "transferencia" | "gratis";
  const back = `/comprar/${type === "book" ? "libro" : "curso"}/${itemId}`;
  const item = await loadItem(type, itemId);
  const db = createAdminClient();

  if (await userOwns(user.id, type, itemId)) redirect(type === "book" ? "/panel/libros" : `/panel/cursos/${item.slug}`);

  // Datos del comprador (necesarios para Pagopar y para el certificado)
  const document = String(formData.get("document_number") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (document || phone) {
    await db
      .from("profiles")
      .update({ ...(document ? { document_number: document } : {}), ...(phone ? { phone } : {}) })
      .eq("id", user.id);
  }

  const base = {
    user_id: user.id,
    item_type: type,
    item_id: item.id,
    item_title: item.title,
    amount_pyg: item.price_pyg,
  };

  if (item.price_pyg === 0 || method === "gratis") {
    if (item.price_pyg !== 0) redirect(back);
    const { data: order } = await db.from("orders").insert({ ...base, payment_method: "cortesia" }).select("id").single();
    await fulfillOrder(order!.id);
    redirect(type === "book" ? "/panel/libros" : `/panel/cursos/${item.slug}`);
  }

  // Reutiliza un pedido pendiente del mismo producto y método
  const { data: existing } = await db
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_type", type)
    .eq("item_id", item.id)
    .eq("payment_method", method)
    .in("status", ["pending", "review"])
    .maybeSingle();
  const orderId =
    existing?.id ??
    (await db.from("orders").insert({ ...base, payment_method: method }).select("id").single()).data!.id;

  if (method === "transferencia") redirect(`/panel/compras/${orderId}`);

  if (!pagoparEnabled()) redirect(`${back}?error=${encodeURIComponent("El pago con Pagopar no está habilitado.")}`);
  if (!document) redirect(`${back}?error=${encodeURIComponent("Ingresá tu número de cédula para pagar con Pagopar.")}`);

  let url: string;
  try {
    const tx = await iniciarTransaccion({
      orderId,
      amount: item.price_pyg,
      itemName: item.title,
      itemId: item.id,
      imageUrl: coverUrl(item.cover_path),
      buyer: {
        name: profile.full_name || user.email!,
        email: user.email!,
        phone: phone || profile.phone || "",
        document,
      },
    });
    await db.from("orders").update({ provider_ref: tx.hash }).eq("id", orderId);
    url = tx.url;
  } catch (e) {
    console.error(e);
    redirect(`${back}?error=${encodeURIComponent("No se pudo iniciar el pago con Pagopar. Probá de nuevo o elegí transferencia.")}`);
  }
  redirect(url);
}
