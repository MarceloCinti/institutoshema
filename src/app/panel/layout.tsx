import SideNav from "@/components/SideNav";
import { requireUser } from "@/lib/auth";

const ITEMS = [
  { href: "/panel", label: "Inicio" },
  { href: "/panel/cursos", label: "Mis cursos" },
  { href: "/panel/libros", label: "Mis libros" },
  { href: "/panel/compras", label: "Mis compras" },
  { href: "/panel/certificados", label: "Certificados" },
  { href: "/panel/perfil", label: "Mi perfil" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <SideNav title="Mi campus" items={ITEMS} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
