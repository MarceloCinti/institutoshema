import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatPYG, ORDER_STATUS, PAYMENT_METHOD } from "@/lib/format";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import GrantAccessForm from "@/components/GrantAccessForm";
import { approveOrder, rejectOrder } from "../actions";
import type { Order } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Pedidos" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { v: "", label: "Todos" },
  { v: "review", label: "En revisión" },
  { v: "pending", label: "Pendientes" },
  { v: "paid", label: "Pagados" },
  { v: "rejected", label: "Rechazados" },
];

export default async function PedidosAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const sp = await searchParams;
  let q = createAdminClient()
    .from("orders")
    .select("*, profiles(full_name, email, phone)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (sp.estado) q = q.eq("status", sp.estado);
  const { data } = await q;
  const orders = (data ?? []) as (Order & { profiles: { full_name: string; email: string; phone: string | null } })[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pedidos y pagos</h1>
      <Flash ok={sp.ok} error={sp.error} />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.v}
            href={f.v ? `/admin/pedidos?estado=${f.v}` : "/admin/pedidos"}
            className={`badge !px-3 !py-1 ${(sp.estado ?? "") === f.v ? "bg-navy-800 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="table">
          <thead>
            <tr><th>Fecha</th><th>Alumno</th><th>Producto</th><th>Monto / pago</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap">
                  {formatDate(o.created_at)}
                  <span className="block font-mono text-xs text-gray-400">#{o.id.slice(0, 8).toUpperCase()}</span>
                </td>
                <td>
                  <Link href={`/admin/alumnos/${o.user_id}`} className="hover:text-gold-700">{o.profiles?.full_name || "—"}</Link>
                  <span className="block text-xs text-gray-500">{o.profiles?.email}</span>
                </td>
                <td>{o.item_title}</td>
                <td className="whitespace-nowrap">
                  {formatPYG(o.amount_pyg)}
                  <span className="block text-xs text-gray-500">{PAYMENT_METHOD[o.payment_method]}</span>
                </td>
                <td>
                  <span className={`badge ${ORDER_STATUS[o.status].className}`}>{ORDER_STATUS[o.status].label}</span>
                  {o.admin_note && <span className="block text-xs text-gray-500">{o.admin_note}</span>}
                </td>
                <td className="min-w-[170px]">
                  {o.receipt_path && (
                    <a href={`/admin/pedidos/${o.id}/comprobante`} target="_blank" className="mb-2 block text-gold-700 hover:underline">
                      Ver comprobante
                    </a>
                  )}
                  {["pending", "review", "rejected"].includes(o.status) && (
                    <div className="space-y-2">
                      <form action={approveOrder}>
                        <input type="hidden" name="id" value={o.id} />
                        <SubmitButton className="btn-primary !px-3 !py-1 text-xs" confirm="¿Confirmar el pago y habilitar el acceso?">
                          Aprobar pago
                        </SubmitButton>
                      </form>
                      {o.status !== "rejected" && (
                        <form action={rejectOrder} className="flex flex-col items-start gap-1">
                          <input type="hidden" name="id" value={o.id} />
                          <input name="note" className="input !py-1 text-xs" placeholder="Motivo" />
                          <SubmitButton className="btn-danger !px-2 !py-1 text-xs">Rechazar</SubmitButton>
                        </form>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={6} className="py-8 text-center text-gray-500">No hay pedidos.</td></tr>}
          </tbody>
        </table>
      </div>

      <GrantAccessForm back="/admin/pedidos" />
    </div>
  );
}
