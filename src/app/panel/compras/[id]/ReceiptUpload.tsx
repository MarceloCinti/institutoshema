"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { attachReceipt } from "./actions";

export default function ReceiptUpload({ orderId, userId }: { orderId: string; userId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setError("El archivo supera los 10 MB.");
    setBusy(true);
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${orderId}-${Date.now()}.${ext}`;
    const { error: upErr } = await createClient().storage.from("receipts").upload(path, file, { contentType: file.type });
    if (upErr) {
      setBusy(false);
      return setError("No se pudo subir el comprobante. Intentá de nuevo.");
    }
    try {
      await attachReceipt(orderId, path);
      router.refresh();
    } catch {
      setError("No se pudo registrar el comprobante.");
    }
    setBusy(false);
  }

  return (
    <div>
      <label className="btn-gold cursor-pointer">
        {busy ? "Subiendo…" : "Subir comprobante (foto o PDF)"}
        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onChange} disabled={busy} />
      </label>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
