import { coverUrl } from "@/lib/format";

/** Portada de libro o curso; si no hay imagen muestra una portada con el sello. */
export default function Cover({
  path,
  title,
  aspect = "aspect-[3/4]",
}: {
  path: string | null;
  title: string;
  aspect?: string;
}) {
  const url = coverUrl(path);
  return (
    <div className={`relative ${aspect} w-full overflow-hidden rounded-xl bg-navy-900`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-instituto-shema.svg" alt="" className="h-20 w-20 opacity-90" />
          <span className="font-serif text-sm text-gold-300">{title}</span>
        </div>
      )}
    </div>
  );
}
