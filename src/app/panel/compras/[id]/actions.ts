"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function attachReceipt(orderId: string, path: string) {
  const { user } = await requireUser();
  if (!path.startsWith(`${user.id}/`)) throw new Error("Ruta inválida");
  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("user_id, status").eq("id", orderId).single();
  if (!order || order.user_id !== user.id || !["pending", "review", "rejected"].includes(order.status)) {
    throw new Error("Pedido inválido");
  }
  await db.from("orders").update({ receipt_path: path, status: "review" }).eq("id", orderId);
  revalidatePath(`/panel/compras/${orderId}`);
}

export async function cancelOrder(formData: FormData) {
  const { user } = await requireUser();
  const id = String(formData.get("id"));
  await createAdminClient()
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pending");
  revalidatePath("/panel/compras");
}
