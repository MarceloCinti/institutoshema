import { redirect } from "next/navigation";

export const metadata = { title: "Verificar certificado" };

async function buscar(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (code) redirect(`/verificar/${encodeURIComponent(code)}`);
}

export default function VerificarPage() {
  return (
    <div className="container-page max-w-lg py-16">
      <h1 className="text-3xl font-bold">Verificar certificado</h1>
      <p className="mt-2 text-gray-600">Ingresá el código que figura en el certificado (por ejemplo IS-ABCDE-FGHJK).</p>
      <form action={buscar} className="mt-6 flex gap-2">
        <input name="code" className="input uppercase" placeholder="IS-XXXXX-XXXXX" required />
        <button className="btn-primary">Verificar</button>
      </form>
    </div>
  );
}
