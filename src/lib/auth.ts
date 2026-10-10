import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await createAdminClient().from("profiles").select("*").eq("id", user.id).single();
  return { user, profile: profile as Profile | null };
});

export async function requireUser() {
  const { user, profile } = await getSession();
  if (!user || !profile) redirect("/ingresar");
  return { user, profile };
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.profile.role !== "admin") redirect("/panel");
  return session;
}
