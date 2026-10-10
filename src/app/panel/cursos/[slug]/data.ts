import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { userOwns } from "@/lib/orders";
import type { Course } from "@/lib/types";

export async function loadEnrolledCourse(slug: string) {
  const session = await requireUser();
  const { data: course } = await createAdminClient().from("courses").select("*").eq("slug", slug).maybeSingle<Course>();
  if (!course) notFound();
  const isAdmin = session.profile.role === "admin";
  if (!isAdmin && !(await userOwns(session.user.id, "course", course.id))) notFound();
  return { ...session, course, isAdmin };
}
