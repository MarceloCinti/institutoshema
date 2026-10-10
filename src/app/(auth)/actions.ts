"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const site = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function safeNext(value: FormDataEntryValue | null) {
  const n = String(value ?? "");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/panel";
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")).trim(),
    password: String(formData.get("password")),
  });
  if (error) {
    const msg = error.message.includes("Email not confirmed")
      ? "Tenés que confirmar tu correo antes de ingresar. Revisá tu bandeja de entrada."
      : "Correo o contraseña incorrectos.";
    redirect(`/ingresar?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password"));
  if (password.length < 8) redirect(`/registrarse?error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres.")}`);
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")).trim(),
    password,
    options: {
      data: { full_name: String(formData.get("full_name")).trim(), phone: String(formData.get("phone") ?? "").trim() },
      emailRedirectTo: `${site()}/auth/callback?next=/panel`,
    },
  });
  if (error) {
    const msg = error.message.includes("already registered")
      ? "Ese correo ya está registrado. Ingresá o recuperá tu contraseña."
      : "No pudimos crear la cuenta: " + error.message;
    redirect(`/registrarse?error=${encodeURIComponent(msg)}`);
  }
  if (data.session) redirect("/panel");
  redirect(`/ingresar?ok=${encodeURIComponent("¡Cuenta creada! Te enviamos un correo para confirmar tu dirección.")}`);
}

export async function requestReset(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(String(formData.get("email")).trim(), {
    redirectTo: `${site()}/auth/callback?next=/nueva-contrasena`,
  });
  redirect(`/recuperar?ok=${encodeURIComponent("Si el correo está registrado, vas a recibir un enlace para crear una nueva contraseña.")}`);
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password"));
  if (password.length < 8) redirect(`/nueva-contrasena?error=${encodeURIComponent("Mínimo 8 caracteres.")}`);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/nueva-contrasena?error=${encodeURIComponent("El enlace expiró. Pedí uno nuevo.")}`);
  redirect(`/panel?ok=${encodeURIComponent("Contraseña actualizada.")}`);
}
