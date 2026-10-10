import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ATTENDANCE_THRESHOLD, getStudentCourseState } from "@/lib/academic";
import { youtubeId } from "@/lib/lessons";
import { formatDate } from "@/lib/format";
import LessonPlayer from "@/components/LessonPlayer";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { loadEnrolledCourse } from "../../data";
import { submitAttendanceCode } from "./actions";

export default async function ClasePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { slug, lessonId } = await params;
  const sp = await searchParams;
  const { user, course } = await loadEnrolledCourse(slug);
  const state = await getStudentCourseState(user.id, course);

  const flat = state.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })));
  const idx = flat.findIndex((l) => l.id === lessonId);
  if (idx < 0) notFound();
  const lesson = flat[idx];
  if (!lesson.module.unlocked) notFound();
  const prev = flat[idx - 1];
  const next = flat[idx + 1];

  const db = createAdminClient();
  const { data: progress } = await db
    .from("lesson_progress")
    .select("last_position, watched_seconds, attended")
    .eq("user_id", user.id)
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  let signedUrl: string | null = null;
  if (lesson.video_path) {
    const { data } = await db.storage.from("videos").createSignedUrl(lesson.video_path, 60 * 60 * 4);
    signedUrl = data?.signedUrl ?? null;
  }
  const ytId = youtubeId(lesson.video_url);
  const hasVideo = !!(signedUrl || ytId);
  const back = `/panel/cursos/${course.slug}/clase/${lesson.id}`;

  return (
    <div>
      <Link href={`/panel/cursos/${course.slug}`} className="text-sm text-gold-700 hover:underline">← {course.title}</Link>
      <p className="mt-2 text-xs uppercase tracking-widest text-gray-500">{lesson.module.title}</p>
      <h1 className="text-2xl font-bold">{lesson.title}</h1>
      <div className="mt-3">
        <Flash ok={sp.ok} error={sp.error} />
      </div>

      {lesson.video_source === "live" && (
        <div className="card mb-6 !p-5">
          <p className="font-semibold text-navy-900">🔴 Clase en vivo</p>
          {lesson.live_at && <p className="text-sm text-gray-600">{formatDate(lesson.live_at, true)} (hora de Paraguay)</p>}
          {lesson.live_url && (
            <a href={lesson.live_url} target="_blank" rel="noreferrer" className="btn-gold mt-3">
              Entrar a la clase en vivo
            </a>
          )}
          {!progress?.attended && (
            <form action={submitAttendanceCode} className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="lesson_id" value={lesson.id} />
              <input type="hidden" name="back" value={back} />
              <div>
                <label className="label" htmlFor="code">Código de asistencia (lo dicta el profesor durante la clase)</label>
                <input id="code" name="code" className="input uppercase" required />
              </div>
              <SubmitButton>Registrar asistencia</SubmitButton>
            </form>
          )}
          {hasVideo && <p className="mt-3 text-xs text-gray-500">¿No pudiste estar en vivo? Mirá la grabación abajo para registrar tu asistencia.</p>}
        </div>
      )}

      {hasVideo ? (
        <LessonPlayer
          lessonId={lesson.id}
          videoUrl={signedUrl}
          youtubeId={ytId}
          duration={lesson.duration_seconds}
          initialWatched={progress?.watched_seconds ?? 0}
          initialPosition={progress?.last_position ?? 0}
          attended={!!progress?.attended}
          threshold={ATTENDANCE_THRESHOLD}
        />
      ) : lesson.video_source !== "live" ? (
        <p className="card text-gray-600">El video de esta clase todavía no está disponible.</p>
      ) : progress?.attended ? (
        <p className="alert-ok">✓ Asistencia registrada para esta clase</p>
      ) : null}

      {lesson.description && <div className="card mt-6 whitespace-pre-line text-gray-700">{lesson.description}</div>}

      <div className="mt-6 flex justify-between gap-4">
        {prev ? (
          <Link href={`/panel/cursos/${course.slug}/clase/${prev.id}`} className="btn-outline">← Anterior</Link>
        ) : <span />}
        {next && next.module.unlocked ? (
          <Link href={`/panel/cursos/${course.slug}/clase/${next.id}`} className="btn-primary">Siguiente →</Link>
        ) : (
          <Link href={`/panel/cursos/${course.slug}`} className="btn-primary">Volver al curso</Link>
        )}
      </div>
    </div>
  );
}
