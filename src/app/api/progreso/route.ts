import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ATTENDANCE_THRESHOLD } from "@/lib/academic";
import { getLessonForUser } from "@/lib/lessons";

/**
 * Registra segundos reproducidos de una clase. El servidor limita lo acreditado al tiempo
 * real transcurrido desde el último envío, para que no se pueda "inflar" la asistencia.
 */
export async function POST(request: NextRequest) {
  const { user } = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const lessonId = String(body.lessonId ?? "");
  const seconds = Math.max(0, Math.floor(Number(body.seconds) || 0));
  const position = Math.max(0, Math.floor(Number(body.position) || 0));
  const clientDuration = Math.max(0, Math.floor(Number(body.duration) || 0));

  const found = await getLessonForUser(user.id, lessonId);
  if (!found) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  const { lesson } = found;

  const db = createAdminClient();
  const { data: prev } = await db
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const now = Date.now();
  const elapsed = prev ? (now - new Date(prev.updated_at).getTime()) / 1000 : 30;
  const credited = Math.min(seconds, Math.floor(elapsed * 1.1), 120);

  const watched = (prev?.watched_seconds ?? 0) + credited;
  const duration = lesson.duration_seconds || Math.max(clientDuration, 60);
  const reached = watched >= duration * ATTENDANCE_THRESHOLD;
  const attended = prev?.attended || reached;

  const row = {
    user_id: user.id,
    lesson_id: lessonId,
    watched_seconds: watched,
    last_position: position,
    presence_checks: (prev?.presence_checks ?? 0) + (body.presence ? 1 : 0),
    attended,
    attended_at: prev?.attended_at ?? (attended ? new Date(now).toISOString() : null),
    attendance_method: prev?.attendance_method ?? (attended ? "video" : null),
    // sólo avanza el reloj si se acreditó tiempo, así los envíos de presencia no restan segundos
    updated_at: credited > 0 || !prev ? new Date(now).toISOString() : prev.updated_at,
  };
  await db.from("lesson_progress").upsert(row, { onConflict: "user_id,lesson_id" });

  return NextResponse.json({ watched_seconds: watched, attended });
}
