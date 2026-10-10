import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Certificados" };

export default async function Certificados() {
  const { user } = await requireUser();
  const { data } = await createAdminClient()
    .from("certificates")
    .select("*")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">Mis certificados</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(data ?? []).map((c) => (
          <div key={c.id} className="card">
            <p className="text-xs uppercase tracking-widest text-gold-700">Certificado</p>
            <p className="mt-1 text-lg font-bold text-navy-900">{c.course_title}</p>
            <p className="text-sm text-gray-600">
              Nota final {c.final_score}% · {formatDate(c.issued_at)}
            </p>
            <p className="mt-1 font-mono text-xs text-gray-400">{c.code}</p>
            <div className="mt-4 flex gap-2">
              <a href={`/api/certificados/${c.code}`} className="btn-gold !py-2">Descargar PDF</a>
              <Link href={`/verificar/${c.code}`} className="btn-outline !py-2">Ver verificación</Link>
            </div>
          </div>
        ))}
      </div>
      {!data?.length && (
        <p className="mt-6 text-gray-600">
          Cuando completes un curso (asistencia a todas las clases y exámenes aprobados) tu certificado aparecerá aquí.
        </p>
      )}
    </div>
  );
}
