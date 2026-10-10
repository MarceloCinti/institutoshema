import Link from "next/link";
import AuthCard from "../AuthCard";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { signUp } from "../actions";

export const metadata = { title: "Crear cuenta" };

export default async function RegistrarsePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <AuthCard title="Crear cuenta de alumno">
      <Flash error={sp.error} />
      <form action={signUp} className="space-y-4">
        <div>
          <label className="label" htmlFor="full_name">Nombre y apellido</label>
          <input id="full_name" name="full_name" className="input" required placeholder="Como figurará en tu certificado" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Celular (WhatsApp)</label>
          <input id="phone" name="phone" className="input" placeholder="0981 123 456" />
        </div>
        <div>
          <label className="label" htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" className="input" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña (mínimo 8 caracteres)</label>
          <input id="password" name="password" type="password" minLength={8} className="input" required autoComplete="new-password" />
        </div>
        <SubmitButton className="btn-gold w-full" pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm">
        ¿Ya tenés cuenta? <Link href="/ingresar" className="text-gold-700 hover:underline">Ingresá</Link>
      </p>
    </AuthCard>
  );
}
