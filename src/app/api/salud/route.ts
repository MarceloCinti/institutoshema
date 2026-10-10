import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/** Diagnóstico de configuración: sólo informa si cada variable existe y si la clave secreta funciona (nunca sus valores). */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let serviceRole: "ok" | "falta" | "invalida" | "error" = service ? "error" : "falta";
  if (url && service) {
    try {
      const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
      // quiz_questions no tiene políticas: sólo la service_role puede leerla.
      const { error } = await db.from("quiz_questions").select("id", { head: true, count: "exact" });
      serviceRole = error ? "invalida" : "ok";
    } catch {
      serviceRole = "error";
    }
  }

  const status = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(anon),
    SUPABASE_SERVICE_ROLE_KEY: serviceRole,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    PAGOPAR: Boolean(process.env.PAGOPAR_PUBLIC_KEY && process.env.PAGOPAR_PRIVATE_KEY),
  };
  const ok = status.NEXT_PUBLIC_SUPABASE_URL && status.NEXT_PUBLIC_SUPABASE_ANON_KEY && serviceRole === "ok";
  return NextResponse.json({ ok, ...status }, { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
