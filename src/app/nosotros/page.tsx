import Image from "next/image";

export const metadata = { title: "Nosotros" };

export default function NosotrosPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <div className="flex flex-col items-center text-center">
        <Image src="/logo-congregacion.webp" alt="Congregación Shema Israel" width={160} height={160} />
        <h1 className="mt-6 text-3xl font-bold">Sobre el Instituto Shema</h1>
      </div>
      <div className="mt-8 space-y-4 leading-relaxed text-gray-700">
        <p>
          El <strong>Instituto Shema</strong> es la escuela de formación bíblica de la{" "}
          <strong>Congregación Shema Israel</strong> de Paraguay, bajo la dirección de su pastor presidente,{" "}
          <strong>Félix Guerrero</strong>.
        </p>
        <p>
          Nuestro propósito es enseñar las Escrituras desde sus raíces hebreas, formando discípulos que escuchen y
          obedezcan la Palabra, tal como lo expresa el Shemá: <em>“Escucha, Israel: el Señor nuestro Dios, el Señor uno
          es”</em> (Deuteronomio 6:4).
        </p>
        <p>
          Todos nuestros cursos son online: podés estudiar desde cualquier ciudad del Paraguay o del exterior, participar
          de las clases en vivo, ver las grabaciones y obtener un certificado verificable al completar cada programa.
        </p>
      </div>
    </div>
  );
}
