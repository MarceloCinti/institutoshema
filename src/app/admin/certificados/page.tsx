import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Certificados" };
export const dynamic = "force-dynamic";

export default async function CertificadosAdmin() {
  const { data } = await createAdminClient().from("certificates").select("*").order("issued_at", { ascending: false }).limit(500);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Certificados emitidos</h1>
      <div className="card overflow-x-auto !p-0">
        <table className="table">
          <thead>
            <tr><th>Código</th><th>Alumno</th><th>Curso</th><th>Nota</th><th>Fecha</th><th /></tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-xs">{c.code}</td>
                <td><Link href={`/admin/alumnos/${c.user_id}`} className="hover:text-gold-700">{c.student_name}</Link></td>
                <td>{c.course_title}</td>
                <td>{c.final_score}%</td>
                <td className="whitespace-nowrap">{formatDate(c.issued_at)}</td>
                <td><a href={`/api/certificados/${c.code}`} className="text-gold-700 hover:underline">PDF</a></td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={6} className="py-8 text-center text-gray-500">Todavía no hay certificados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
