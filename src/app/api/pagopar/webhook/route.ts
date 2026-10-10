import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillOrder } from "@/lib/orders";
import { consultarPedido, tokenValido } from "@/lib/pagopar";

/**
 * Notificación de Pagopar. Configurar en el panel de Pagopar como "URL de respuesta (webhook)":
 *   {NEXT_PUBLIC_SITE_URL}/api/pagopar/webhook
 * Pagopar espera que se le devuelva el mismo array "resultado" que envía.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const resultado = body?.resultado;
  const r = Array.isArray(resultado) ? resultado[0] : null;
  if (!r?.hash_pedido || !r?.token || !tokenValido(r.hash_pedido, r.token)) {
    return NextResponse.json({ error: "token inválido" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("id, status").eq("provider_ref", r.hash_pedido).maybeSingle();
  if (order) {
    if (r.pagado) {
      const check = await consultarPedido(r.hash_pedido).catch(() => null);
      // Si la consulta falla confiamos en el webhook firmado; si responde, debe confirmar el pago.
      if (!check || check.pagado) await fulfillOrder(order.id);
    } else if (r.cancelado && order.status === "pending") {
      await db.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    }
  }

  return NextResponse.json(resultado);
}
