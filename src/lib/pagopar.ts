import "server-only";
import { createHash } from "crypto";

/**
 * Integración con Pagopar (pasarela de pagos de Paraguay).
 * Documentación: https://soporte.pagopar.com/portal/es/kb/articles/api-integracion-medios-pagos
 *
 * Flujo:
 *  1. iniciarTransaccion() crea el pedido en Pagopar y devuelve un hash.
 *  2. El alumno es redirigido a https://www.pagopar.com/pagos/{hash}.
 *  3. Pagopar avisa a /api/pagopar/webhook cuando el pago se confirma.
 *  4. Pagopar redirige al alumno a la "URL de respuesta" configurada en el panel de Pagopar:
 *     {NEXT_PUBLIC_SITE_URL}/pago/resultado?hash=($hash)
 */

const API = "https://api.pagopar.com/api";

const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");

export function pagoparEnabled() {
  return !!(process.env.PAGOPAR_PUBLIC_KEY && process.env.PAGOPAR_PRIVATE_KEY);
}

type Buyer = { name: string; email: string; phone: string; document: string };

export async function iniciarTransaccion(params: {
  orderId: string;
  amount: number;
  itemName: string;
  itemId: string;
  imageUrl?: string | null;
  buyer: Buyer;
}) {
  const publicKey = process.env.PAGOPAR_PUBLIC_KEY!;
  const privateKey = process.env.PAGOPAR_PRIVATE_KEY!;
  const amount = Math.round(params.amount);

  const deadline = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  const fechaMaxima = new Date(deadline.getTime() - 4 * 3600 * 1000).toISOString().slice(0, 19).replace("T", " ");

  const body = {
    token: sha1(privateKey + params.orderId + String(amount)),
    public_key: publicKey,
    monto_total: amount,
    tipo_pedido: "VENTA-COMERCIO",
    compras_items: [
      {
        ciudad: "1",
        nombre: params.itemName,
        cantidad: 1,
        categoria: "909",
        public_key: publicKey,
        url_imagen: params.imageUrl ?? "",
        descripcion: params.itemName,
        id_producto: params.itemId,
        precio_total: amount,
        vendedor_telefono: "",
        vendedor_direccion: "",
        vendedor_direccion_referencia: "",
        vendedor_direccion_coordenadas: "",
      },
    ],
    fecha_maxima_pago: fechaMaxima,
    id_pedido_comercio: params.orderId,
    descripcion_resumen: params.itemName,
    forma_pago: 9,
    comprador: {
      ruc: "",
      email: params.buyer.email,
      ciudad: null,
      nombre: params.buyer.name,
      telefono: params.buyer.phone,
      direccion: "",
      documento: params.buyer.document,
      coordenadas: "",
      razon_social: params.buyer.name,
      tipo_documento: "CI",
      direccion_referencia: null,
    },
  };

  const res = await fetch(`${API}/comercios/2.0/iniciar-transaccion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json();
  if (!json?.respuesta || !json?.resultado?.[0]?.data) {
    throw new Error("Pagopar: " + (typeof json?.resultado === "string" ? json.resultado : "no se pudo iniciar el pago"));
  }
  const hash: string = json.resultado[0].data;
  return { hash, url: `https://www.pagopar.com/pagos/${hash}` };
}

/** Valida el token que envía Pagopar en el webhook: sha1(private_key + hash_pedido). */
export function tokenValido(hashPedido: string, token: string) {
  return sha1(process.env.PAGOPAR_PRIVATE_KEY! + hashPedido) === token;
}

/** Consulta el estado real del pedido en Pagopar (no confiar sólo en el webhook). */
export async function consultarPedido(hashPedido: string) {
  const res = await fetch(`${API}/pedidos/1.1/traer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hash_pedido: hashPedido,
      token: sha1(process.env.PAGOPAR_PRIVATE_KEY! + "CONSULTA"),
      token_publico: process.env.PAGOPAR_PUBLIC_KEY,
    }),
    cache: "no-store",
  });
  const json = await res.json();
  const r = json?.resultado?.[0];
  return { pagado: !!r?.pagado, cancelado: !!r?.cancelado, raw: json };
}
