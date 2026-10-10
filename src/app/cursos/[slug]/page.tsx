import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { getCourseOutline } from "@/lib/academic";
import { userOwns } from "@/lib/orders";
import { formatDuration, formatPYG } from "@/lib/format";
import Cover from "@/components/Cover";
import type { Course } from "@/lib/types";

export default async function CursoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).eq("published", true).maybeSingle<Course>();
  if (!course) notFound();

  const [outline, { user }] = await Promise.all([getCourseOutline(course.id), getSession()]);
  const owned = user ? await userOwns(user.id, "course", course.id) : false;
  const lessons = outline.reduce((n, m) => n + m.lessons.length, 0);
  const totalSeconds = outline.reduce((n, m) => n + m.lessons.reduce((s, l) => s + l.duration_seconds, 0), 0);

  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <p className="text-sm uppercase tracking-widest text-gold-700">Curso</p>
        <h1 className="mt-1 text-3xl font-bold">{course.title}</h1>
        {course.subtitle && <p className="mt-1 text-lg text-gray-600">{course.subtitle}</p>}
        <p className="mt-2 text-sm text-gray-500">Prof. {course.teacher}</p>
        <div className="mt-6 whitespace-pre-line leading-relaxed text-gray-700">{course.description}</div>

        <h2 className="mt-10 text-xl font-bold">Programa del curso</h2>
        <p className="text-sm text-gray-500">
          {outline.length} módulos · {lessons} clases{totalSeconds ? ` · ${formatDuration(totalSeconds)}` : ""}
        </p>
        <ol className="mt-4 space-y-4">
          {outline.map((m, i) => (
            <li key={m.id} className="card !p-5">
              <p className="font-semibold text-navy-800">
                Módulo {i + 1}: {m.title}
              </p>
              {m.description && <p className="mt-1 text-sm text-gray-600">{m.description}</p>}
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                {m.lessons.map((l) => (
                  <li key={l.id} className="flex justify-between gap-4">
                    <span>
                      {l.video_source === "live" ? "🔴 " : "▶ "}
                      {l.title}
                    </span>
                    <span className="text-gray-400">{formatDuration(l.duration_seconds)}</span>
                  </li>
                ))}
                {m.questionCount > 0 && <li className="text-gold-700">✎ Examen del módulo ({m.questionCount} preguntas)</li>}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card">
          <Cover path={course.cover_path} title={course.title} aspect="aspect-video" />
          <p className="mt-4 text-2xl font-bold text-navy-900">{course.price_pyg ? formatPYG(course.price_pyg) : "Gratuito"}</p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li>✓ Acceso a todas las clases grabadas y en vivo</li>
            <li>✓ Registro de asistencia por clase</li>
            <li>✓ Examen por módulo (aprobación {course.passing_score}%)</li>
            <li>✓ Certificado verificable del Instituto Shema</li>
          </ul>
          {owned ? (
            <Link href={`/panel/cursos/${course.slug}`} className="btn-primary mt-5 w-full">Ir al curso</Link>
          ) : (
            <Link href={`/comprar/curso/${course.id}`} className="btn-gold mt-5 w-full">Inscribirme</Link>
          )}
        </div>
      </aside>
    </div>
  );
}
