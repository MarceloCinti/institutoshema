import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";

const NAV = [
  { href: "/cursos", label: "Cursos" },
  { href: "/libros", label: "Libros" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/verificar", label: "Verificar certificado" },
];

export default async function Header() {
  const { user, profile } = await getSession();
  return (
    <header className="sticky top-0 z-30 border-b border-gold-100 bg-navy-900 text-white">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-instituto-shema.svg" alt="Instituto Shema" width={44} height={44} priority />
          <span className="font-serif text-lg font-bold tracking-wide text-gold-300">Instituto Shema</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-gray-200 hover:text-gold-300">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              {profile?.role === "admin" && (
                <Link href="/admin" className="rounded-lg px-3 py-2 text-gold-300 hover:bg-navy-800">
                  Administración
                </Link>
              )}
              <Link href="/panel" className="btn-gold !py-2">
                Mi panel
              </Link>
              <form action="/auth/salir" method="post">
                <button className="rounded-lg px-3 py-2 text-gray-300 hover:bg-navy-800">Salir</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/ingresar" className="rounded-lg px-3 py-2 hover:bg-navy-800">
                Ingresar
              </Link>
              <Link href="/registrarse" className="btn-gold !py-2">
                Inscribirme
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="container-page flex gap-4 overflow-x-auto pb-2 text-xs md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap text-gray-200">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
