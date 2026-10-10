import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillOrder } from "@/lib/orders";
import { consultarPedido, pagoparEnabled } from "@/lib/pagopar";

export const metadata = { title: "Resultado del pago" };
export const dynamic = "force-dynamic";

/** Página a la que Pagopar redirige al alumno: /pago/resultado?hash=($hash) */
export default async function ResultadoPago({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { hash } = await searchParams;
  const { user } = await requireUser();
  const db = createAdminClient();
  const { data: order } = hash
    ? await db.from("orders").select("*").eq("provider_ref", hash).eq("user_id", user.id).maybeSingle()
    : { data: null };

  let paid = order?.status === "paid";
  if (order && !paid && pagoparEnabled()) {
    const check = await consultarPedido(hash).catch(() => null);
    if (check?.pagado) {
      await fulfillOrder(order.id);
      paid = true;
    }
  }

  return (
    <div className="container-page max-w-lg py-16 text-center">
      {paid ? (
        <>
          <p className="text-5xl">✓</p>
          <h1 className="mt-4 text-2xl font-bold">¡Pago confirmado!</h1>
          <p className="mt-2 text-gray-600">Ya tenés acceso a “{order!.item_title}”.</p>
          <Link href={order!.item_type === "book" ? "/panel/libros" : "/panel/cursos"} className="btn-gold mt-6">
            Ir a mi panel
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Estamos esperando la confirmación del pago</h1>
          <p className="mt-2 text-gray-600">
            Si elegiste pagar en una boca de cobranza (Aquí Pago, Pago Express, etc.), tu acceso se habilitará
            automáticamente cuando se acredite el pago. Podés ver el estado en “Mis compras”.
          </p>
          <Link href="/panel/compras" className="btn-primary mt-6">Ver mis compras</Link>
        </>
      )}
    </div>
  );
}
