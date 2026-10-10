import AuthCard from "../AuthCard";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { updatePassword } from "../actions";

export const metadata = { title: "Nueva contraseña" };

export default async function NuevaContrasenaPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <AuthCard title="Nueva contraseña">
      <Flash error={sp.error} />
      <form action={updatePassword} className="space-y-4">
        <div>
          <label className="label" htmlFor="password">Nueva contraseña</label>
          <input id="password" name="password" type="password" minLength={8} className="input" required />
        </div>
        <SubmitButton className="btn-primary w-full">Guardar</SubmitButton>
      </form>
    </AuthCard>
  );
}
