export default function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <p className="alert-error mb-4">{error}</p>;
  if (ok) return <p className="alert-ok mb-4">{ok}</p>;
  return null;
}
