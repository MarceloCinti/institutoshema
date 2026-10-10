import Link from "next/link";
import Cover from "@/components/Cover";
import { formatPYG } from "@/lib/format";
import type { Book, Course } from "@/lib/types";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/cursos/${course.slug}`} className="card group flex flex-col gap-3 !p-4 transition hover:shadow-md">
      <Cover path={course.cover_path} title={course.title} aspect="aspect-video" />
      <div className="flex flex-1 flex-col">
        <h3 className="text-lg font-bold group-hover:text-gold-700">{course.title}</h3>
        {course.subtitle && <p className="text-sm text-gray-600">{course.subtitle}</p>}
        <p className="mt-1 text-xs text-gray-500">Prof. {course.teacher}</p>
        <p className="mt-auto pt-3 font-semibold text-navy-800">
          {course.price_pyg ? formatPYG(course.price_pyg) : "Gratuito"}
        </p>
      </div>
    </Link>
  );
}

export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/libros/${book.slug}`} className="card group flex flex-col gap-3 !p-4 transition hover:shadow-md">
      <Cover path={book.cover_path} title={book.title} />
      <div className="flex flex-1 flex-col">
        <h3 className="font-bold group-hover:text-gold-700">{book.title}</h3>
        <p className="text-xs text-gray-500">{book.author}</p>
        <p className="mt-auto pt-3 font-semibold text-navy-800">{book.price_pyg ? formatPYG(book.price_pyg) : "Gratuito"}</p>
      </div>
    </Link>
  );
}
