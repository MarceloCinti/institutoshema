import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { pagoparEnabled } from "@/lib/pagopar";
import { formatPYG } from "@/lib/format";
import Cover from "@/components/Cover";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { checkout } from "../../actions";

export const metadata = { title: "Finalizar compra" };

export default async function ComprarPage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string; id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { tipo, id } = await params;
  const sp = await searchParams;
  if (tipo !== "libro" && tipo !== "curso") notFound();
  const type = tipo === "libro" ? "book" : "course";
  const { profile } = await requireUser();
  const { data: item } = await createAdminClient()
    .from(type === "book" ? "books" : "courses")
    .select(type === "book" ? "id, title, subtitle, price_pyg, cover_path, published, file_path" : "id, title, subtitle, price_pyg, cover_path, published")
    .eq("id", id)
    .maybeSingle<{ id: string; title: string; subtitle: string | null; price_pyg: number; cover_path: string | null; published: boolean; file_path?: string | null }>();
  if (!item || !item.published || (type === "book" && !item.file_path)) notFound();
  const free = item.price_pyg === 0;
  const pagopar = pagoparEnabled();

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Finalizar {type === "book" ? "compra" : "inscripción"}</h1>
      <Flash error={sp.error} />
      <div className="card mt-6 flex gap-5">
        <div className="w-28 shrink-0">
          <Cover path={item.cover_path} title={item.title} aspect={type === "book" ? "aspect-[3/4]" : "aspect-video"} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-gold-700">{type === "book" ? "Libro digital" : "Curso online"}</p>
          <p className="text-xl font-bold text-navy-900">{item.title}</p>
          {item.subtitle && <p className="text-sm text-gray-600">{item.subtitle}</p>}
          <p className="mt-2 text-2xl font-bold">{free ? "Gratuito" : formatPYG(item.price_pyg)}</p>
        </div>
      </div>

      <form action={checkout} className="card mt-6 space-y-5">
        <input type="hidden" name="item_type" value={type} />
        <input type="hidden" name="item_id" value={item.id} />
        {free ? (
          <>
            <input type="hidden" name="method" value="gratis" />
            <SubmitButton className="btn-gold w-full">Obtener acceso gratuito</SubmitButton>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="document_number">Cédula de identidad</label>
                <input id="document_number" name="document_number" className="input" defaultValue={profile.document_number ?? ""} placeholder="1234567" />
              </div>
              <div>
                <label className="label" htmlFor="phone">Celular</label>
                <input id="phone" name="phone" className="input" defaultValue={profile.phone ?? ""} placeholder="0981 123 456" />
              </div>
            </div>
            <fieldset className="space-y-3">
              <legend className="label">Forma de pago</legend>
              {pagopar && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50">
                  <input type="radio" name="method" value="pagopar" defaultChecked className="mt-1" />
                  <span>
                    <span className="font-semibold">Pagopar</span>
                    <span className="block text-sm text-gray-600">
                      Tarjeta de crédito/débito, billeteras (Tigo Money, Personal), Aquí Pago, Pago Express, transferencia
                      bancaria. El acceso se habilita automáticamente.
                    </span>
                  </span>
                </label>
              )}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50">
                <input type="radio" name="method" value="transferencia" defaultChecked={!pagopar} className="mt-1" />
                <span>
                  <span className="font-semibold">Transferencia bancaria / depósito</span>
                  <span className="block text-sm text-gray-600">
                    Transferís a la cuenta de la congregación y subís el comprobante. Habilitamos tu acceso cuando lo
                    verificamos (normalmente en menos de 24 horas).
                  </span>
                </span>
              </label>
            </fieldset>
            <SubmitButton className="btn-gold w-full" pendingText="Redirigiendo…">
              Continuar al pago
            </SubmitButton>
          </>
        )}
      </form>
    </div>
  );
}
