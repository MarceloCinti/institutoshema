import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl font-bold">Página no encontrada</h1>
      <p className="mt-2 text-gray-600">La página que buscás no existe o no tenés acceso.</p>
      <Link href="/" className="btn-primary mt-6">Volver al inicio</Link>
    </div>
  );
}
