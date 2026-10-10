import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatPYG, ORDER_STATUS, PAYMENT_METHOD } from "@/lib/format";
import SubmitButton from "@/components/SubmitButton";
import type { Order } from "@/lib/types";
import ReceiptUpload from "./ReceiptUpload";
import { cancelOrder } from "./actions";

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const { data: order } = await createAdminClient().from("orders").select("*").eq("id", id).eq("user_id", user.id).maybeSingle<Order>();
  if (!order) notFound();
  const st = ORDER_STATUS[order.status];
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-2xl">
      <Link href="/panel/compras" className="text-sm text-gold-700 hover:underline">← Mis compras</Link>
      <h1 className="mt-2 text-2xl font-bold">Pedido #{shortId}</h1>
      <div className="card mt-4 space-y-2 text-sm">
        <p><strong>Producto:</strong> {order.item_title}</p>
        <p><strong>Monto:</strong> {formatPYG(order.amount_pyg)}</p>
        <p><strong>Forma de pago:</strong> {PAYMENT_METHOD[order.payment_method]}</p>
        <p><strong>Fecha:</strong> {formatDate(order.created_at, true)}</p>
        <p><strong>Estado:</strong> <span className={`badge ${st.className}`}>{st.label}</span></p>
        {order.admin_note && <p><strong>Nota del instituto:</strong> {order.admin_note}</p>}
      </div>

      {order.payment_method === "transferencia" && ["pending", "review", "rejected"].includes(order.status) && (
        <div className="card mt-6 space-y-4">
          <h2 className="text-lg font-bold">Datos para la transferencia</h2>
          <p className="rounded-lg bg-navy-50 p-4 text-sm text-navy-900">{process.env.NEXT_PUBLIC_BANK_INFO}</p>
          <p className="text-sm text-gray-600">
            Monto exacto: <strong>{formatPYG(order.amount_pyg)}</strong>. En el concepto indicá: <strong>Pedido {shortId}</strong>.
          </p>
          {order.status === "review" ? (
            <p className="alert-ok">Recibimos tu comprobante. Lo estamos verificando; te habilitaremos el acceso a la brevedad.</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">Después de transferir, subí la foto o PDF del comprobante:</p>
              <ReceiptUpload orderId={order.id} userId={user.id} />
            </>
          )}
          {wa && (
            <a
              className="inline-block text-sm text-gold-700 hover:underline"
              href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola, envío el comprobante del pedido ${shortId} (${order.item_title}).`)}`}
              target="_blank"
              rel="noreferrer"
            >
              ¿Dudas? Escribinos por WhatsApp
            </a>
          )}
          {order.status === "pending" && (
            <form action={cancelOrder}>
              <input type="hidden" name="id" value={order.id} />
              <SubmitButton className="btn-danger" confirm="¿Cancelar este pedido?">Cancelar pedido</SubmitButton>
            </form>
          )}
        </div>
      )}

      {order.status === "paid" && (
        <Link href={order.item_type === "book" ? "/panel/libros" : "/panel/cursos"} className="btn-primary mt-6">
          Ir a {order.item_type === "book" ? "Mis libros" : "Mis cursos"}
        </Link>
      )}
    </div>
  );
}
