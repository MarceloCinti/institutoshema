import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";

/** Marca el pedido como pagado y habilita el libro o curso. Idempotente. */
export async function fulfillOrder(orderId: string, note?: string) {
  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).single<Order>();
  if (!order) throw new Error("Pedido no encontrado");

  if (order.status !== "paid") {
    await db
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString(), ...(note ? { admin_note: note } : {}) })
      .eq("id", orderId);
  }

  if (order.item_type === "book") {
    await db
      .from("book_purchases")
      .upsert({ user_id: order.user_id, book_id: order.item_id, order_id: order.id }, { onConflict: "user_id,book_id" });
  } else {
    await db
      .from("enrollments")
      .upsert({ user_id: order.user_id, course_id: order.item_id, order_id: order.id }, { onConflict: "user_id,course_id" });
  }
}

export async function userOwns(userId: string, itemType: "book" | "course", itemId: string) {
  const db = createAdminClient();
  const table = itemType === "book" ? "book_purchases" : "enrollments";
  const col = itemType === "book" ? "book_id" : "course_id";
  const { data } = await db.from(table).select("user_id").eq("user_id", userId).eq(col, itemId).maybeSingle();
  return !!data;
}
