import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatPYG, ORDER_STATUS } from "@/lib/format";
import type { Order } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const db = createAdminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: paid }, { count: students }, { count: review }, { count: certs }, { data: recent }] = await Promise.all([
    db.from("orders").select("amount_pyg, paid_at, item_type").eq("status", "paid"),
    db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    db.from("orders").select("*", { count: "exact", head: true }).eq("status", "review"),
    db.from("certificates").select("*", { count: "exact", head: true }),
    db.from("orders").select("*, profiles(full_name, email)").order("created_at", { ascending: false }).limit(10),
  ]);

  const total = (paid ?? []).reduce((s, o) => s + o.amount_pyg, 0);
  const month = (paid ?? []).filter((o) => o.paid_at && new Date(o.paid_at) >= monthStart).reduce((s, o) => s + o.amount_pyg, 0);
  const books = (paid ?? []).filter((o) => o.item_type === "book").reduce((s, o) => s + o.amount_pyg, 0);

  const stats = [
    { label: "Ventas del mes", value: formatPYG(month) },
    { label: "Ventas totales", value: formatPYG(total) },
    { label: "— de libros", value: formatPYG(books) },
    { label: "— de cursos", value: formatPYG(total - books) },
    { label: "Alumnos registrados", value: students ?? 0 },
    { label: "Certificados emitidos", value: certs ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Resumen</h1>
      {!!review && (
        <Link href="/admin/pedidos?estado=review" className="alert-error mt-4 block">
          Hay {review} comprobante(s) de transferencia esperando revisión →
        </Link>
      )}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card !p-4">
            <p className="text-xl font-bold text-navy-900">{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold">Últimos pedidos</h2>
        <Link href="/admin/pedidos" className="text-sm text-gold-700 hover:underline">Ver todos →</Link>
      </div>
      <div className="card mt-4 overflow-x-auto !p-0">
        <table className="table">
          <thead>
            <tr><th>Fecha</th><th>Alumno</th><th>Producto</th><th>Monto</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {((recent ?? []) as (Order & { profiles: { full_name: string; email: string } })[]).map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap">{formatDate(o.created_at)}</td>
                <td>{o.profiles?.full_name || o.profiles?.email}</td>
                <td>{o.item_title}</td>
                <td className="whitespace-nowrap">{formatPYG(o.amount_pyg)}</td>
                <td><span className={`badge ${ORDER_STATUS[o.status].className}`}>{ORDER_STATUS[o.status].label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
