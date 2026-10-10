import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookCard, CourseCard } from "@/components/CatalogCards";
import type { Book, Course } from "@/lib/types";

export const revalidate = 60;

const STEPS = [
  { n: "1", title: "Creá tu cuenta", text: "Registrate gratis con tu correo y completá tus datos." },
  { n: "2", title: "Inscribite", text: "Elegí un curso y pagá con Pagopar o transferencia bancaria." },
  { n: "3", title: "Estudiá", text: "Mirá las clases a tu ritmo o en vivo. Tu asistencia queda registrada." },
  { n: "4", title: "Certificate", text: "Aprobá el examen de cada módulo y descargá tu certificado." },
];

export default async function Home() {
  const supabase = await createClient();
  const [{ data: courses }, { data: books }] = await Promise.all([
    supabase.from("courses").select("*").eq("published", true).order("created_at", { ascending: false }).limit(3),
    supabase.from("books").select("*").eq("published", true).order("created_at", { ascending: false }).limit(4),
  ]);

  return (
    <>
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold-300">Congregación Shema Israel · Paraguay</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
              Instituto <span className="text-gold-400">Shema</span>
            </h1>
            <p className="mt-4 text-lg text-gray-200">
              Escuela bíblica online con el Pastor Félix Guerrero. Estudiá las Escrituras desde sus raíces hebreas, desde
              cualquier lugar, y obtené tu certificado.
            </p>
            <p className="mt-4 italic text-gold-300">“Shemá Israel, Adonai Eloheinu, Adonai Ejad.” — Deuteronomio 6:4</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cursos" className="btn-gold">Ver cursos</Link>
              <Link href="/libros" className="btn border border-gold-300 text-gold-300 hover:bg-navy-700">Comprar libros</Link>
            </div>
          </div>
          <div className="flex justify-center">
            <Image src="/logo-instituto-shema.svg" alt="Sello del Instituto Shema" width={360} height={360} priority />
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="text-center text-2xl font-bold">¿Cómo funciona?</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 font-serif font-bold text-gold-700">
                {s.n}
              </div>
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Cursos</h2>
          <Link href="/cursos" className="text-sm font-semibold text-gold-700 hover:underline">Ver todos →</Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(courses as Course[] | null)?.map((c) => <CourseCard key={c.id} course={c} />)}
          {!courses?.length && <p className="text-gray-500">Muy pronto publicaremos nuevos cursos.</p>}
        </div>
      </section>

      <section className="container-page py-10">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Libros del Pastor Félix Guerrero</h2>
          <Link href="/libros" className="text-sm font-semibold text-gold-700 hover:underline">Ver todos →</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {(books as Book[] | null)?.map((b) => <BookCard key={b.id} book={b} />)}
          {!books?.length && <p className="text-gray-500">Muy pronto.</p>}
        </div>
      </section>
    </>
  );
}
