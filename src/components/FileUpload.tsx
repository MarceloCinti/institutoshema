"use client";
import { useRef, useState } from "react";
import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";

type Props = {
  bucket: "covers" | "books" | "videos";
  folder: string;
  name: string;               // nombre del input oculto con la ruta subida
  accept: string;
  label: string;
  initialPath?: string | null;
  durationInputName?: string; // para videos: completa automáticamente la duración
};

/** Sube archivos directo a Supabase Storage (subida reanudable, apta para videos grandes). */
export default function FileUpload({ bucket, folder, name, accept, label, initialPath, durationInputName }: Props) {
  const [path, setPath] = useState(initialPath ?? "");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<tus.Upload | null>(null);

  async function onFile(file: File) {
    setError(null);
    if (durationInputName && file.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const input = document.querySelector<HTMLInputElement>(`input[name="${durationInputName}"]`);
        if (input && v.duration) input.value = String(Math.round(v.duration));
        URL.revokeObjectURL(v.src);
      };
      v.src = URL.createObjectURL(file);
    }

    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return setError("La sesión expiró. Volvé a ingresar.");

    const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "-").toLowerCase();
    const objectName = `${folder}/${Date.now()}-${safe}`;
    setProgress(0);

    const upload = new tus.Upload(file, {
      endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${token}`, "x-upsert": "true" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: bucket, objectName, contentType: file.type || "application/octet-stream", cacheControl: "3600" },
      chunkSize: 6 * 1024 * 1024,
      onError: (err) => {
        setProgress(null);
        setError("Error al subir: " + err.message);
      },
      onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
      onSuccess: () => {
        setProgress(null);
        setPath(objectName);
      },
    });
    uploadRef.current = upload;
    const previous = await upload.findPreviousUploads();
    if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
    upload.start();
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={path} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-outline cursor-pointer !py-1.5">
          {path ? "Reemplazar archivo" : "Elegir archivo"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={progress !== null}
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
        {path && progress === null && <span className="break-all text-xs text-gray-500">✓ {path.split("/").pop()}</span>}
        {path && progress === null && (
          <button type="button" className="text-xs text-red-700 hover:underline" onClick={() => setPath("")}>
            Quitar
          </button>
        )}
      </div>
      {progress !== null && (
        <div className="mt-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-navy-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-600">Subiendo… {progress}% — no cierres esta página.</p>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
