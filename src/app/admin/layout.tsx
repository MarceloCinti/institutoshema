import SideNav from "@/components/SideNav";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: { default: "Administración", template: "%s | Admin Instituto Shema" } };

const ITEMS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos y pagos" },
  { href: "/admin/cursos", label: "Cursos y clases" },
  { href: "/admin/libros", label: "Libros" },
  { href: "/admin/alumnos", label: "Alumnos" },
  { href: "/admin/certificados", label: "Certificados" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <SideNav title="Administración" items={ITEMS} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
