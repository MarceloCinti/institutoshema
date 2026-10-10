import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Verificación de certificado" };

export default async function VerificarCodigo({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { data: cert } = await createAdminClient()
    .from("certificates")
    .select("code, student_name, course_title, final_score, issued_at")
    .eq("code", decodeURIComponent(code).toUpperCase())
    .maybeSingle();

  return (
    <div className="container-page max-w-xl py-16 text-center">
      <Image src="/logo-instituto-shema.svg" alt="" width={110} height={110} className="mx-auto" />
      {cert ? (
        <div className="card mt-6">
          <p className="badge bg-emerald-100 text-emerald-800">✓ Certificado válido</p>
          <p className="mt-4 text-sm text-gray-500">Se certifica que</p>
          <p className="font-serif text-2xl font-bold text-navy-900">{cert.student_name}</p>
          <p className="mt-2 text-sm text-gray-500">completó y aprobó el curso</p>
          <p className="font-serif text-xl text-gold-700">{cert.course_title}</p>
          <p className="mt-4 text-sm text-gray-600">
            Calificación final: {cert.final_score}% · Emitido el {formatDate(cert.issued_at)}
          </p>
          <p className="mt-2 font-mono text-xs text-gray-400">{cert.code}</p>
        </div>
      ) : (
        <div className="alert-error mt-6">No encontramos ningún certificado con el código “{decodeURIComponent(code)}”.</div>
      )}
      <Link href="/verificar" className="mt-6 inline-block text-sm text-gold-700 hover:underline">Verificar otro código</Link>
    </div>
  );
}
