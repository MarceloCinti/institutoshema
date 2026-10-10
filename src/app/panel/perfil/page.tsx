import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";

export const metadata = { title: "Mi perfil" };

async function saveProfile(formData: FormData) {
  "use server";
  const { user } = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name")).trim(),
      phone: String(formData.get("phone")).trim() || null,
      document_number: String(formData.get("document_number")).trim() || null,
      city: String(formData.get("city")).trim() || null,
    })
    .eq("id", user.id);
  revalidatePath("/panel");
  redirect(`/panel/perfil?${error ? "error=No se pudo guardar" : "ok=Datos guardados"}`);
}

export default async function PerfilPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { user, profile } = await requireUser();
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <div className="mt-4">
        <Flash ok={sp.ok} error={sp.error} />
      </div>
      <form action={saveProfile} className="card space-y-4">
        <div>
          <label className="label">Correo electrónico</label>
          <input className="input bg-gray-50" value={user.email ?? ""} disabled />
        </div>
        <div>
          <label className="label" htmlFor="full_name">Nombre y apellido (como figurará en el certificado)</label>
          <input id="full_name" name="full_name" className="input" defaultValue={profile.full_name} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="document_number">Cédula de identidad</label>
            <input id="document_number" name="document_number" className="input" defaultValue={profile.document_number ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Celular</label>
            <input id="phone" name="phone" className="input" defaultValue={profile.phone ?? ""} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="city">Ciudad</label>
          <input id="city" name="city" className="input" defaultValue={profile.city ?? ""} />
        </div>
        <SubmitButton>Guardar cambios</SubmitButton>
      </form>
    </div>
  );
}
