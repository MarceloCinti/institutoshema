import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  return (
    <footer className="mt-16 bg-navy-900 text-gray-300">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div className="flex items-start gap-3">
          <Image src="/logo-congregacion.webp" alt="Congregación Shema Israel" width={56} height={56} className="rounded-full" />
          <div>
            <p className="font-serif text-gold-300">Instituto Shema</p>
            <p className="text-sm">Escuela bíblica de la Congregación Shema Israel — Paraguay.</p>
            <p className="mt-1 text-sm">Pastor presidente: Félix Guerrero.</p>
          </div>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-white">Instituto</p>
          <ul className="space-y-1">
            <li><Link href="/cursos" className="hover:text-gold-300">Cursos</Link></li>
            <li><Link href="/libros" className="hover:text-gold-300">Libros</Link></li>
            <li><Link href="/verificar" className="hover:text-gold-300">Verificar certificado</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-white">Contacto</p>
          {wa && (
            <a href={`https://wa.me/${wa}`} className="hover:text-gold-300" target="_blank" rel="noreferrer">
              WhatsApp: +{wa}
            </a>
          )}
          <p className="mt-3 italic text-gold-300">
            “Escucha, Israel: el Señor nuestro Dios, el Señor uno es.” — Deuteronomio 6:4
          </p>
        </div>
      </div>
      <p className="border-t border-navy-800 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Instituto Shema · Congregación Shema Israel · Paraguay
      </p>
    </footer>
  );
}
