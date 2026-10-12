import { createAdminClient } from "@/lib/supabase/admin";
import { grantAccess } from "@/app/admin/actions";
import SubmitButton from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/auth";

export default async function GrantAccessForm({ back, email }: { back: string; email?: string }) {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: courses }, { data: books }] = await Promise.all([
    db.from("courses").select("id, title").order("title"),
    db.from("books").select("id, title").order("title"),
  ]);
  return (
    <form action={grantAccess} className="card space-y-3">
      <h2 className="font-bold">Habilitar acceso manualmente</h2>
      <p className="text-xs text-gray-500">Para pagos en efectivo, becas o cortesías. El alumno debe estar registrado.</p>
      <input type="hidden" name="back" value={back} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="email" type="email" className="input" placeholder="correo del alumno" defaultValue={email} required />
        <select name="item" className="input" required>
          <optgroup label="Cursos">
            {courses?.map((c) => <option key={c.id} value={`course:${c.id}`}>{c.title}</option>)}
          </optgroup>
          <optgroup label="Libros">
            {books?.map((b) => <option key={b.id} value={`book:${b.id}`}>{b.title}</option>)}
          </optgroup>
        </select>
        <input name="amount" className="input" placeholder="Monto cobrado en Gs. (0 = cortesía)" inputMode="numeric" />
        <input name="note" className="input" placeholder="Nota (opcional)" />
      </div>
      <SubmitButton className="btn-gold !py-2">Habilitar</SubmitButton>
    </form>
  );
}
