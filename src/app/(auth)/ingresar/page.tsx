import Link from "next/link";
import AuthCard from "../AuthCard";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { signIn } from "../actions";

export const metadata = { title: "Ingresar" };

export default async function IngresarPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <AuthCard title="Ingresar al campus">
      <Flash ok={sp.ok} error={sp.error} />
      <form action={signIn} className="space-y-4">
        <input type="hidden" name="next" value={sp.next ?? "/panel"} />
        <div>
          <label className="label" htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" className="input" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" className="input" required autoComplete="current-password" />
        </div>
        <SubmitButton className="btn-primary w-full" pendingText="Ingresando…">Ingresar</SubmitButton>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/recuperar" className="text-gold-700 hover:underline">¿Olvidaste tu contraseña?</Link>
        <Link href="/registrarse" className="text-gold-700 hover:underline">Crear cuenta</Link>
      </div>
    </AuthCard>
  );
}
