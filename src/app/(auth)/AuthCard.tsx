import Image from "next/image";

export default function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-14">
      <div className="card w-full max-w-md">
        <Image src="/logo-instituto-shema.svg" alt="" width={80} height={80} className="mx-auto" />
        <h1 className="mt-4 text-center text-2xl font-bold">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
