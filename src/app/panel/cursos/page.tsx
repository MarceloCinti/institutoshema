import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyCourses } from "@/lib/student";
import Cover from "@/components/Cover";
import ProgressBar from "@/components/ProgressBar";

export const metadata = { title: "Mis cursos" };

export default async function MisCursos() {
  const { user } = await requireUser();
  const courses = await getMyCourses(user.id);
  return (
    <div>
      <h1 className="text-2xl font-bold">Mis cursos</h1>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {courses.map(({ course, state }) => (
          <Link key={course.id} href={`/panel/cursos/${course.slug}`} className="card flex flex-col gap-3 !p-4 hover:shadow-md">
            <Cover path={course.cover_path} title={course.title} aspect="aspect-video" />
            <p className="font-semibold text-navy-900">{course.title}</p>
            <ProgressBar value={state.percent} label={state.completed ? "Completado" : "Progreso"} />
          </Link>
        ))}
      </div>
      {!courses.length && (
        <p className="mt-6 text-gray-600">
          No tenés cursos todavía. <Link href="/cursos" className="text-gold-700 underline">Ver cursos</Link>
        </p>
      )}
    </div>
  );
}
