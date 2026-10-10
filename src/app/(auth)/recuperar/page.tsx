import AuthCard from "../AuthCard";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { requestReset } from "../actions";

export const metadata = { title: "Recuperar contraseña" };

export default async function RecuperarPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <AuthCard title="Recuperar contraseña">
      <Flash ok={sp.ok} error={sp.error} />
      <form action={requestReset} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" className="input" required />
        </div>
        <SubmitButton className="btn-primary w-full">Enviar enlace</SubmitButton>
      </form>
    </AuthCard>
  );
}
