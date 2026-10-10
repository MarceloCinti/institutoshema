export function formatPYG(amount: number) {
  return "Gs. " + new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(value: string | Date, withTime = false) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-PY", {
    timeZone: "America/Asuncion",
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function formatDuration(seconds: number) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function coverUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${path}`;
}

export const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente de pago", className: "bg-amber-100 text-amber-800" },
  review: { label: "Comprobante en revisión", className: "bg-blue-100 text-blue-800" },
  paid: { label: "Pagado", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rechazado", className: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelado", className: "bg-gray-100 text-gray-700" },
};

export const PAYMENT_METHOD: Record<string, string> = {
  pagopar: "Pagopar (tarjeta, billetera, boca de cobranza)",
  transferencia: "Transferencia bancaria",
  cortesia: "Acceso de cortesía",
};
