import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatPYG, ORDER_STATUS, PAYMENT_METHOD } from "@/lib/format";
import type { Order } from "@/lib/types";

export const metadata = { title: "Mis compras" };

export default async function MisCompras() {
  const { user } = await requireUser();
  const { data } = await createAdminClient()
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];

  return (
    <div>
      <h1 className="text-2xl font-bold">Mis compras</h1>
      <div className="card mt-6 overflow-x-auto !p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Monto</th>
              <th>Pago</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap">{formatDate(o.created_at)}</td>
                <td>
                  {o.item_title}
                  <span className="block text-xs text-gray-500">{o.item_type === "book" ? "Libro" : "Curso"}</span>
                </td>
                <td className="whitespace-nowrap">{formatPYG(o.amount_pyg)}</td>
                <td className="text-xs">{PAYMENT_METHOD[o.payment_method]}</td>
                <td>
                  <span className={`badge ${ORDER_STATUS[o.status].className}`}>{ORDER_STATUS[o.status].label}</span>
                </td>
                <td>
                  <Link href={`/panel/compras/${o.id}`} className="text-gold-700 hover:underline">Ver</Link>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">Todavía no realizaste compras.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
