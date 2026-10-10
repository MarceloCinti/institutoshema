export default function ProgressBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-gray-600">
          <span>{label}</span>
          <span>{v}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-gold-500" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
