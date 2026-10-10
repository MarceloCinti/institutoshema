"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  pendingText = "Procesando…",
  className = "btn-primary",
  confirm,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
